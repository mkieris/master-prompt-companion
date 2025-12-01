import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating insights for organization:', organizationId);

    // Fetch all ratings for this organization
    const { data: ratings, error: ratingsError } = await supabase
      .from('content_ratings')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (ratingsError) throw ratingsError;

    if (!ratings || ratings.length < 3) {
      console.log('Not enough ratings to generate insights (need at least 3)');
      return new Response(JSON.stringify({ message: 'Not enough ratings yet' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Group by prompt version
    const ratingsByVersion: Record<string, any[]> = {};
    ratings.forEach(r => {
      const version = r.prompt_version || 'unknown';
      if (!ratingsByVersion[version]) ratingsByVersion[version] = [];
      ratingsByVersion[version].push(r);
    });

    // Analyze each prompt version
    for (const [version, versionRatings] of Object.entries(ratingsByVersion)) {
      if (versionRatings.length < 2) continue;

      const avgRating = versionRatings.reduce((sum, r) => sum + r.rating, 0) / versionRatings.length;
      const lowRatings = versionRatings.filter(r => r.rating <= 3);
      const highRatings = versionRatings.filter(r => r.rating >= 4);

      // Collect feedback patterns
      const categoryFrequency: Record<string, number> = {};
      const feedbackTexts: string[] = [];

      versionRatings.forEach(r => {
        if (r.feedback_categories && Array.isArray(r.feedback_categories)) {
          r.feedback_categories.forEach((cat: string) => {
            categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
          });
        }
        if (r.feedback_text) feedbackTexts.push(r.feedback_text);
      });

      // Prepare AI analysis prompt
      const analysisPrompt = `Du bist ein KI-Experte fuer Content-Optimierung. Analysiere folgende Daten:

PROMPT-VERSION: ${version}
DURCHSCHNITTLICHE BEWERTUNG: ${avgRating.toFixed(2)}/5 (${versionRatings.length} Bewertungen)

POSITIVE BEWERTUNGEN (4-5 Sterne): ${highRatings.length}
NEGATIVE BEWERTUNGEN (1-3 Sterne): ${lowRatings.length}

FEEDBACK-KATEGORIEN (Haeufigkeit):
${Object.entries(categoryFrequency).map(([cat, count]) => cat + ': ' + count + 'x').join('\n')}

NUTZER-FEEDBACK:
${feedbackTexts.slice(0, 10).join('\n---\n')}

AUFGABE:
1. Identifiziere die Hauptprobleme dieser Prompt-Version
2. Welche Aspekte funktionieren gut?
3. Gib 3 konkrete Verbesserungsvorschlaege fuer den System-Prompt
4. Priorisiere: Welche Aenderung haette den groessten Impact?

Antworte im JSON-Format:
{
  "summary": "Kurze Zusammenfassung (max 200 Zeichen)",
  "strengths": ["Staerke 1", "Staerke 2"],
  "weaknesses": ["Schwaeche 1", "Schwaeche 2"],
  "suggestions": [
    {
      "title": "Vorschlag-Titel",
      "description": "Detaillierte Beschreibung",
      "priority": "high|medium|low",
      "expectedImpact": "Was wird sich verbessern?"
    }
  ],
  "recommendedAction": "Naechster Schritt"
}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + LOVABLE_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Du bist Experte fuer Content-Optimierung und System-Prompt-Engineering.' },
            { role: 'user', content: analysisPrompt }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        console.error('AI gateway error:', response.status);
        continue;
      }

      const aiData = await response.json();
      const aiInsight = aiData.choices[0].message.content;

      let parsedInsight;
      try {
        const jsonMatch = aiInsight.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedInsight = JSON.parse(jsonMatch[0]);
        } else {
          parsedInsight = { summary: aiInsight.substring(0, 200), suggestions: [] };
        }
      } catch (parseErr) {
        console.error('Failed to parse AI insight JSON:', parseErr);
        parsedInsight = { summary: aiInsight.substring(0, 200), suggestions: [] };
      }

      // Determine priority based on rating and count
      let priority = 'medium';
      if (avgRating < 3 && versionRatings.length > 5) priority = 'high';
      if (avgRating >= 4) priority = 'low';

      // Check if insight already exists
      const { data: existing } = await supabase
        .from('prompt_insights')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('prompt_version', version)
        .eq('status', 'new')
        .maybeSingle();

      if (existing) {
        // Update existing insight
        await supabase
          .from('prompt_insights')
          .update({
            insight_summary: parsedInsight.summary || 'AI-generierte Analyse',
            detailed_analysis: parsedInsight,
            based_on_ratings_count: versionRatings.length,
            average_rating: avgRating,
            suggestion_priority: priority,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Create new insight
        await supabase
          .from('prompt_insights')
          .insert({
            organization_id: organizationId,
            prompt_version: version,
            insight_type: 'prompt_optimization',
            insight_summary: parsedInsight.summary || 'AI-generierte Analyse',
            detailed_analysis: parsedInsight,
            based_on_ratings_count: versionRatings.length,
            average_rating: avgRating,
            suggestion_priority: priority,
            status: 'new'
          });
      }

      console.log('Generated insight for version:', version);
    }

    return new Response(JSON.stringify({ success: true, message: 'Insights generated' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
