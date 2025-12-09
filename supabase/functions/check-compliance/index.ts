import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Text ist erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: 'API nicht konfiguriert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Starting AI compliance check for text length:", text.length);

    const systemPrompt = `Du bist ein Experte für rechtliche Compliance bei Medizinprodukten und Gesundheitswerbung in Deutschland.

Deine Aufgabe ist es, Texte auf folgende rechtliche Verstöße zu prüfen:

## 1. Heilmittelwerbegesetz (HWG)
- §3 HWG: Irreführende Werbung (übertriebene Wirkversprechen, unwahre Behauptungen)
- §11 HWG: Verbotene Werbemittel (Vorher-Nachher-Bilder, Empfehlungen von Ärzten/Wissenschaftlern ohne Beleg)
- Garantierte Heilungsversprechen
- "100% Wirksamkeit" oder ähnliche absolute Aussagen

## 2. Medizinprodukteverordnung (MDR)
- Fehlende oder falsche CE-Kennzeichnung
- Unzulässige Zweckbestimmungsaussagen
- Falsche Risikoklassen-Angaben
- Fehlende Konformitätserklärungen

## 3. Studien und wissenschaftliche Behauptungen
- Unbelegte wissenschaftliche Claims
- Fehlende Quellenangaben bei Studien
- Irreführende Statistiken
- "Klinisch getestet" ohne echte klinische Prüfung

## 4. Heilaussagen
- Diagnose-Versprechen
- Therapie-Ersatz-Behauptungen
- Heilungsgarantien
- Symptom-Beseitigungs-Versprechen

Antworte AUSSCHLIESSLICH mit einem JSON-Array von Findings. Jedes Finding hat:
- "text": Der problematische Textausschnitt (exakt wie im Original)
- "severity": "critical" | "warning" | "info"
- "category": Kategorie des Problems
- "explanation": Kurze Erklärung warum dies problematisch ist
- "suggestion": Verbesserungsvorschlag

Wenn keine Probleme gefunden werden, gib ein leeres Array [] zurück.

Beispiel-Antwort:
[
  {
    "text": "garantiert Heilung",
    "severity": "critical",
    "category": "Heilversprechen",
    "explanation": "Absolute Heilungsgarantien sind nach HWG §3 unzulässig",
    "suggestion": "Stattdessen: 'kann zur Linderung beitragen'"
  }
]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Prüfe diesen Text auf Compliance-Verstöße:\n\n${text}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit erreicht. Bitte später erneut versuchen.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'API-Guthaben aufgebraucht.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    console.log("AI response:", content.substring(0, 500));

    // Parse JSON from response
    let findings = [];
    try {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        findings = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try direct parse
        findings = JSON.parse(content.trim());
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      findings = [];
    }

    // Validate findings structure
    if (!Array.isArray(findings)) {
      findings = [];
    }

    findings = findings.filter(f => 
      f && 
      typeof f.text === 'string' && 
      typeof f.severity === 'string' &&
      typeof f.category === 'string'
    ).map(f => ({
      text: f.text,
      severity: f.severity,
      category: f.category,
      explanation: f.explanation || '',
      suggestion: f.suggestion || '',
      position: 0
    }));

    console.log("Parsed findings:", findings.length);

    return new Response(
      JSON.stringify({ success: true, findings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Compliance check error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
