-- Create user_prompt_templates table
CREATE TABLE IF NOT EXISTS public.user_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_key TEXT UNIQUE NOT NULL,
  version_name TEXT NOT NULL,
  version_description TEXT,
  prompt_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_prompt_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view active templates
CREATE POLICY "Authenticated users can view active user prompt templates"
  ON public.user_prompt_templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Policy: Admins can manage all templates
CREATE POLICY "Admins can manage user prompt templates"
  ON public.user_prompt_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
      AND (om.role = 'owner' OR om.role = 'admin')
    )
  );

-- Create index
CREATE INDEX idx_user_prompt_templates_version_key ON public.user_prompt_templates(version_key);
CREATE INDEX idx_user_prompt_templates_active ON public.user_prompt_templates(is_active);

-- Insert standard user prompt versions
INSERT INTO public.user_prompt_templates (version_key, version_name, version_description, prompt_template, is_active, metadata) VALUES

-- v1-standard: Klassisches strukturiertes User Prompt
('v1-standard', '📋 Standard', 'Klassisches strukturiertes Prompt mit allen Basis-Informationen', 
'=== GRUNDINFORMATIONEN ===
Marke: {brandName}
Thema: {mainTopic}
Info: {additionalInfo}
{competitorData}

=== ZIELGRUPPE ===
Audience: {targetAudience}
Anrede: {formOfAddress}
Tonalitaet: {tonality}

=== SEO-STRUKTUR ===
Fokus-Keyword: {focusKeyword}
Sekundaer-Keywords: {secondaryKeywords}
W-FRAGEN (MUESSEN beantwortet werden):
{wQuestions}
Wortanzahl: {wordCount}
Max Absatz: {maxParagraphLength} Woerter (STRIKT!)
FAQ: {includeFAQ}

{briefingContent}

=== AUFGABE ===
Erstelle hochwertigen, SEO-optimierten Text der alle Vorgaben erfuellt.',
true,
'{"category": "standard", "complexity": "medium"}'::jsonb),

-- v2-detailed: Ausführliches Prompt mit Kontext
('v2-detailed', '🔍 Detailliert', 'Ausführliches Prompt mit zusätzlichem Kontext und Erklärungen',
'=== PROJEKT-BRIEFING ===
MARKE/HERSTELLER: {brandName}
HAUPTTHEMA: {mainTopic}
ZUSATZINFORMATIONEN: {additionalInfo}

=== WETTBEWERBS-KONTEXT ===
{competitorData}

=== ZIELGRUPPEN-PROFIL ===
Primäre Zielgruppe: {targetAudience}
- B2B: Professionelle Anwender, Entscheider, Fachpublikum
- B2C: Endkunden, Privatpersonen, Allgemeinverständlich
- Mixed: Breites Spektrum von Fachleuten bis Laien

Kommunikationsstil: {formOfAddress}
Tonalitäts-Mix: {tonality}

=== SEO-ANFORDERUNGEN ===
PRIMARY KEYWORD: {focusKeyword} (MUSS in H1 + ersten 100 Wörtern erscheinen)
SECONDARY KEYWORDS: {secondaryKeywords} (natürlich im Text verteilen)

BEANTWORTEN SIE DIESE W-FRAGEN IM TEXT:
{wQuestions}

UMFANG: {wordCount}
ABSATZ-MAXIMUM: {maxParagraphLength} Wörter pro Absatz (STRIKTE EINHALTUNG!)
FAQ-SEKTION: {includeFAQ}

=== ZUSÄTZLICHE BRIEFING-UNTERLAGEN ===
{briefingContent}

=== IHRE AUFGABE ===
Erstellen Sie einen hochwertigen, SEO-optimierten Content, der:
1. Alle genannten Keywords natürlich integriert
2. Die W-Fragen vollständig beantwortet
3. Die Zielgruppe mit dem passenden Ton anspricht
4. Suchmaschinen-Richtlinien und E-E-A-T-Prinzipien erfüllt
5. Echten Mehrwert für die Nutzer bietet',
true,
'{"category": "detailed", "complexity": "high", "focus": "context"}'::jsonb),

-- v3-minimal: Kompaktes Prompt für kreative Freiheit
('v3-minimal', '⚡ Minimal', 'Kompaktes Prompt mit Fokus auf Kerninfos, mehr kreative Freiheit',
'THEMA: {mainTopic} | MARKE: {brandName}
KEYWORD: {focusKeyword} | ANREDE: {formOfAddress}
TON: {tonality} | LÄNGE: {wordCount}

{additionalInfo}

W-FRAGEN BEANTWORTEN:
{wQuestions}

MAX {maxParagraphLength} WÖRTER/ABSATZ | FAQ: {includeFAQ}

{briefingContent}

Erstelle überzeugenden SEO-Content.',
true,
'{"category": "minimal", "complexity": "low", "focus": "creative"}'::jsonb),

-- v4-storytelling: Narrativ-fokussiertes Prompt
('v4-storytelling', '📖 Storytelling', 'Storytelling-orientiertes Prompt mit emotionalen Ankern',
'=== STORY-BRIEF ===
Worum geht es? {mainTopic} von {brandName}
Zusatzinfo: {additionalInfo}

=== DIE ZIELGRUPPE ===
Wer liest? {targetAudience}
Wie sprechen wir? {formOfAddress}
Welcher Ton? {tonality}

=== DER ROTE FADEN ===
Hauptkeyword: {focusKeyword} (subtil einbauen!)
Nebenkeywords: {secondaryKeywords}

Diese Fragen MÜSSEN die Leser beantwortet bekommen:
{wQuestions}

=== WETTBEWERBER-INSIGHTS ===
{competitorData}

=== BRIEFING-MATERIAL ===
{briefingContent}

=== STORYTELLING-AUFGABE ===
Erstelle einen Text, der:
- Mit einem echten Szenario beginnt (nicht mit Produkt!)
- Emotionale Verbindung aufbaut
- Das Problem/Bedürfnis erkennbar macht
- Die Lösung natürlich einführt
- SEO-Anforderungen erfüllt OHNE mechanisch zu wirken

TECHNISCHE VORGABEN:
Umfang: {wordCount} | Max {maxParagraphLength} Wörter/Absatz | FAQ: {includeFAQ}',
true,
'{"category": "storytelling", "complexity": "medium", "focus": "narrative"}'::jsonb),

-- v5-conversion: Conversion-optimiertes Prompt
('v5-conversion', '🎯 Conversion', 'Conversion-fokussiertes Prompt mit klaren CTAs',
'=== CONVERSION-BRIEF ===
PRODUKT/THEMA: {mainTopic}
BRAND: {brandName}
ZUSATZ: {additionalInfo}

=== ZIEL ===
Zielgruppe: {targetAudience} → Konversion!
Ansprache: {formOfAddress}
Tonalität: {tonality}

=== KONKURRENZ-VORTEILE NUTZEN ===
{competitorData}

=== SEO-FUNDAMENT ===
Hero-Keyword: {focusKeyword} (H1 + Intro!)
Support-Keywords: {secondaryKeywords}

W-FRAGEN → KAUFBARRIEREN ABBAUEN:
{wQuestions}

=== BRIEFING-DOKUMENTE ===
{briefingContent}

=== CONVERSION-AUFGABE ===
Erstelle verkaufsstarken Content der:
1. Sofort Nutzen kommuniziert
2. Vertrauen aufbaut (E-E-A-T!)
3. Einwände vorwegnimmt
4. Konkrete CTAs integriert
5. Dringlichkeit erzeugt (subtil!)
6. Social Proof nutzt

VORGABEN:
Länge: {wordCount} | Absatz-Max: {maxParagraphLength} Wörter | FAQ: {includeFAQ}

FOKUS: Nicht nur informieren → ÜBERZEUGEN!',
true,
'{"category": "conversion", "complexity": "high", "focus": "sales"}'::jsonb);

-- Add trigger for updated_at
CREATE TRIGGER update_user_prompt_templates_updated_at
  BEFORE UPDATE ON public.user_prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();