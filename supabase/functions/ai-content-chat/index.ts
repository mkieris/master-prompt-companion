import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Du bist ein erfahrener SEO-Content-Stratege und führst Benutzer interaktiv durch die Erstellung von hochwertigem SEO-Content.

DEINE AUFGABEN:
1. Führe den Benutzer Schritt für Schritt durch den Content-Erstellungsprozess
2. Stelle gezielte Fragen, um alle notwendigen Informationen zu sammeln
3. Analysiere jede Antwort und extrahiere relevante Daten
4. Gib hilfreiche Tipps und Empfehlungen basierend auf SEO-Best-Practices
5. Nutze das Domain-Wissen wenn vorhanden, um personalisierte Vorschläge zu machen

SCHRITTE IM PROZESS:
1. pageType: Seitentyp bestimmen (Produktseite, Kategorieseite, Ratgeber/Blog, Landingpage)
2. keyword: Fokus-Keyword und sekundäre Keywords erfragen
3. audience: Zielgruppe definieren (B2B/B2C, Demografie, Bedürfnisse)
4. content: Inhaltliche Details (Produkt/Service Info, USPs, wichtige Punkte)
5. style: Tonalität und Stil festlegen
6. generate: Zusammenfassung und Content-Generierung

WICHTIGE REGELN:
- Sei freundlich, hilfsbereit und professionell
- Stelle immer nur 1-2 Fragen auf einmal
- Gib konkrete Beispiele und Optionen
- Bestätige erfasste Informationen
- Wenn Domain-Wissen vorhanden ist, nutze es für personalisierte Vorschläge
- Formatiere mit **fett** für wichtige Begriffe
- Nutze • für Aufzählungen
- Halte Antworten prägnant aber informativ

DATENEXTRAKTION:
Nach jeder Benutzerantwort, extrahiere relevante Daten und gib sie im folgenden JSON-Format am ENDE deiner Antwort zurück (nur wenn neue Daten extrahiert wurden):

---EXTRACTED_DATA---
{"pageType": "...", "focusKeyword": "...", "nextStep": 2}
---END_DATA---

Mögliche Felder:
- pageType: string (produktseite, kategorieseite, ratgeber, landingpage)
- focusKeyword: string
- secondaryKeywords: string[]
- audienceType: string (B2B, B2C, Beide)
- targetAudience: string (Beschreibung)
- tonality: string
- searchIntent: string[] (know, do, buy, go)
- usps: string[]
- productInfo: string
- companyInfo: string
- wQuestions: string[]
- nextStep: number (1-7, Index des nächsten Schritts)`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userMessage, currentStep, extractedData, domainKnowledge } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context message
    let contextMessage = SYSTEM_PROMPT;
    
    if (domainKnowledge) {
      contextMessage += `\n\nDOMAIN-WISSEN (nutze diese Informationen für personalisierte Vorschläge):
- Unternehmen: ${domainKnowledge.companyName || 'Unbekannt'}
- Branche: ${domainKnowledge.industry || 'Unbekannt'}
- Zielgruppe: ${domainKnowledge.targetAudience || 'Unbekannt'}
- Produkte/Services: ${JSON.stringify(domainKnowledge.products || [])}
- USPs: ${JSON.stringify(domainKnowledge.usps || [])}
- Brand Voice: ${domainKnowledge.brandVoice || 'Nicht definiert'}
- Keywords: ${JSON.stringify(domainKnowledge.keywords || [])}`;
    }

    if (extractedData && Object.keys(extractedData).length > 0) {
      contextMessage += `\n\nBEREITS ERFASSTE DATEN:
${JSON.stringify(extractedData, null, 2)}`;
    }

    contextMessage += `\n\nAKTUELLER SCHRITT: ${currentStep}`;

    // Build messages array
    const apiMessages = [
      { role: 'system', content: contextMessage },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    console.log('Calling Lovable AI with messages:', apiMessages.length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit erreicht. Bitte versuche es in einer Minute erneut.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI-Credits aufgebraucht. Bitte Guthaben aufladen.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI API error');
    }

    // Transform the stream to extract data and pass content
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                // Check for extracted data marker
                if (content.includes('---EXTRACTED_DATA---')) {
                  // Don't send the marker to client
                  continue;
                }
                if (content.includes('---END_DATA---')) {
                  continue;
                }
                
                // Check if this chunk contains JSON data
                const dataMatch = content.match(/\{[^}]+\}/);
                if (dataMatch && content.includes('nextStep')) {
                  try {
                    const extractedJson = JSON.parse(dataMatch[0]);
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({ extractedData: extractedJson, nextStep: extractedJson.nextStep })}\n\n`)
                    );
                  } catch (e) {
                    // Not valid JSON, send as content
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                    );
                  }
                } else {
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error in ai-content-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});