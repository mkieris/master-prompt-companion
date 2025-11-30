import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Du bist ein erfahrener SEO-Content-Stratege und führst Benutzer interaktiv durch die Erstellung von hochwertigem SEO-Content. Du arbeitest wie ein professioneller Content-Berater.

DEINE AUFGABEN:
1. Führe den Benutzer Schritt für Schritt durch den Content-Erstellungsprozess
2. Stelle gezielte Fragen mit klaren Optionen zum Anklicken
3. Analysiere jede Antwort und extrahiere relevante Daten
4. Gib hilfreiche Tipps und Empfehlungen basierend auf SEO-Best-Practices
5. Nutze das Domain-Wissen wenn vorhanden, um personalisierte Vorschläge zu machen

SCHRITTE IM PROZESS:
1. pageType: Seitentyp bestimmen
2. keyword: Fokus-Keyword und sekundäre Keywords
3. audience: Zielgruppe und Ansprache
4. content: Inhaltliche Details
5. style: Tonalität und Textstruktur
6. generate: Zusammenfassung und Content-Generierung vorbereiten

SCHRITT 1 - SEITENTYP:
Frage nach dem Seitentyp mit diesen Optionen:
• Produktseite (einzelnes Produkt mit Hersteller, Spezifikationen)
• Kategorieseite (Shop-Kategorie, Produktübersicht)
• Ratgeber / Blog (informativer Artikel)
• Landingpage (Conversion-orientiert)

SCHRITT 2 - KEYWORDS:
Erfrage:
1. Fokus-Keyword (Hauptkeyword für SEO)
2. 3-5 Sekundäre Keywords (verwandte Begriffe)
3. Suchintention - biete diese Optionen:
   • Know (Information suchen)
   • Do (Aktion ausführen)
   • Buy (Kaufen/vergleichen)
   • Go (Zu Seite navigieren)
4. W-Fragen die beantwortet werden sollen (z.B. "Was ist...?", "Wie funktioniert...?")

SCHRITT 3 - ZIELGRUPPE:
Erfrage:
1. Zielgruppe mit Optionen:
   • B2B (Fachpublikum, Unternehmen)
   • B2C (Endverbraucher)
   • Beide (Gemischt)

2. Anredeform:
   • Du (locker, modern)
   • Sie (formell, professionell)

3. Sprache:
   • Deutsch
   • Englisch
   • Französisch

SCHRITT 4 - INHALT:
Je nach Seitentyp frage:
- Bei Produktseiten: Hersteller/Marke, Produktname, USPs, technische Details
- Bei Kategorieseiten: Kategoriename, welche Produkte enthalten
- Bei Ratgeber: Thema, Hauptfragen die beantwortet werden sollen
- Bei Landingpages: Angebot, Conversion-Ziel

Erfrage auch:
- Alleinstellungsmerkmale (USPs) - was macht das Produkt/Angebot besonders?
- Wichtige Punkte die erwähnt werden müssen
- Call-to-Action (Was soll der Leser tun?)

SCHRITT 5 - TONALITÄT & STRUKTUR:
1. Tonalität mit diesen Optionen:
   • Expertenmix (70% Fachwissen, 20% Lösung, 10% Story) - für B2B-Entscheider
   • Beratermix (40% Fachwissen, 40% Lösung, 20% Story) - für Vergleichsphase
   • Storytelling-Mix (30% Fachwissen, 30% Lösung, 40% Story) - für emotionale Käufe
   • Conversion-Mix (20% Fachwissen, 60% Lösung, 20% Story) - für Produktseiten
   • Balanced-Mix (33% Fachwissen, 33% Lösung, 33% Story) - für Landingpages

2. Textlänge:
   • Kurz (ca. 500 Wörter)
   • Kompakt (ca. 800 Wörter)
   • Mittel (ca. 1000 Wörter)
   • Standard (ca. 1500 Wörter)
   • Umfangreich (ca. 2000 Wörter)
   • Ausführlich (ca. 3000+ Wörter)

3. Überschriften-Struktur:
   • Flach (nur H2)
   • Zweistufig (H2 + H3) - empfohlen
   • Dreistufig (H2 + H3 + H4)

4. Zusätzliche Elemente:
   • Einleitung (kurzer Intro-Text)
   • FAQ-Bereich (häufig gestellte Fragen)
   • Keyword-Dichte (normal 1-2%, hoch 2-3%)

SCHRITT 6 - ZUSAMMENFASSUNG:
Fasse alle gesammelten Informationen zusammen und bereite die Content-Generierung vor.

WICHTIGE REGELN:
- Sei freundlich, hilfsbereit und professionell
- Stelle IMMER Fragen mit klaren Optionen zum Anklicken (nutze • für Aufzählungen)
- Nach jeder Option-Frage erlaube auch eigene Eingaben
- Gib konkrete Beispiele
- Bestätige erfasste Informationen kurz
- Wenn Domain-Wissen vorhanden ist, nutze es für personalisierte Vorschläge
- Formatiere mit **fett** für wichtige Begriffe
- Halte Antworten prägnant aber informativ
- Frage pro Nachricht nur 1-2 Dinge ab, nicht alles auf einmal!

FORMATIERUNG DER OPTIONEN:
Nutze IMMER dieses Format für Auswahloptionen:
• Option 1
• Option 2
• Option 3

DATENEXTRAKTION:
Nach jeder Benutzerantwort, extrahiere relevante Daten und gib sie im folgenden JSON-Format am ENDE deiner Antwort zurück (nur wenn neue Daten extrahiert wurden):

---EXTRACTED_DATA---
{"pageType": "...", "focusKeyword": "...", "nextStep": 2}
---END_DATA---

Mögliche Felder zum Extrahieren:
- pageType: string (produktseite, kategorieseite, ratgeber, landingpage)
- focusKeyword: string
- secondaryKeywords: string[]
- searchIntent: string[] (know, do, buy, go)
- wQuestions: string[]
- audienceType: string (B2B, B2C, Beide)
- formOfAddress: string (du, sie)
- language: string (de, en, fr)
- tonality: string (expert-mix, consultant-mix, storytelling-mix, conversion-mix, balanced-mix)
- wordCount: string (500, 800, 1000, 1500, 2000, 3000)
- headingStructure: string (h2-only, h2-h3, h2-h3-h4)
- includeIntro: boolean
- includeFAQ: boolean
- keywordDensity: string (normal, high)
- brandName: string
- productName: string
- usps: string[]
- productInfo: string
- pageGoal: string (CTA)
- nextStep: number (1-7)`;

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
      contextMessage += `\n\n=== DOMAIN-WISSEN (nutze diese Informationen für personalisierte Vorschläge) ===
- Unternehmen: ${domainKnowledge.companyName || 'Unbekannt'}
- Branche: ${domainKnowledge.industry || 'Unbekannt'}
- Zielgruppe: ${domainKnowledge.targetAudience || 'Unbekannt'}
- Produkte/Services: ${JSON.stringify(domainKnowledge.products || [])}
- USPs: ${JSON.stringify(domainKnowledge.usps || [])}
- Brand Voice: ${domainKnowledge.brandVoice || 'Nicht definiert'}
- Keywords: ${JSON.stringify(domainKnowledge.keywords || [])}

Nutze dieses Wissen um:
1. Passende Keywords vorzuschlagen
2. Die Zielgruppe besser einzuschätzen
3. USPs und Produktinfos einzufließen lassen
4. Den Brand Voice im Tonalitätsvorschlag zu berücksichtigen`;
    }

    if (extractedData && Object.keys(extractedData).length > 0) {
      contextMessage += `\n\n=== BEREITS ERFASSTE DATEN ===
${JSON.stringify(extractedData, null, 2)}

Bestätige diese Daten kurz und fahre mit dem nächsten Schritt fort.`;
    }

    const stepNames = ['intro', 'pageType', 'keyword', 'audience', 'content', 'style', 'generate'];
    contextMessage += `\n\nAKTUELLER SCHRITT: ${currentStep} (${stepNames[currentStep] || 'unknown'})`;

    // Build messages array
    const apiMessages = [
      { role: 'system', content: contextMessage },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ];

    console.log('Calling Lovable AI with messages:', apiMessages.length, 'currentStep:', currentStep);

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
      console.error('AI API error:', response.status, errorText);
      
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
      throw new Error(`AI API error: ${response.status}`);
    }

    // Buffer to accumulate content and look for data markers
    let fullContent = '';
    let extractedDataJson: any = null;
    
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Before finishing, check if we have extracted data to send
              if (extractedDataJson) {
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({ extractedData: extractedDataJson, nextStep: extractedDataJson.nextStep })}\n\n`)
                );
              }
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                fullContent += content;
                
                // Check for data markers and extract
                const dataStartIdx = fullContent.indexOf('---EXTRACTED_DATA---');
                const dataEndIdx = fullContent.indexOf('---END_DATA---');
                
                if (dataStartIdx !== -1 && dataEndIdx !== -1 && dataEndIdx > dataStartIdx) {
                  const jsonStr = fullContent.substring(dataStartIdx + 20, dataEndIdx).trim();
                  try {
                    extractedDataJson = JSON.parse(jsonStr);
                    console.log('Extracted data:', extractedDataJson);
                    // Remove the data section from content being shown
                    fullContent = fullContent.substring(0, dataStartIdx);
                  } catch (e) {
                    console.error('Failed to parse extracted data:', jsonStr);
                  }
                }
                
                // Don't send content if we're in the data section
                if (fullContent.includes('---EXTRACTED_DATA---') && !fullContent.includes('---END_DATA---')) {
                  continue;
                }
                
                // Send content that's before any data marker
                let contentToSend = content;
                if (content.includes('---EXTRACTED_DATA---') || content.includes('---END_DATA---') || content.includes('"nextStep"')) {
                  continue; // Skip sending data markers
                }
                
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({ content: contentToSend })}\n\n`)
                );
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
