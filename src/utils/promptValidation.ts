/**
 * Validierungslogik: Prüft, ob System-Prompt-Version und User-Eingaben konsistent sind
 * und warnt bei potenziellen Widersprüchen
 */

export interface ValidationWarning {
  severity: 'warning' | 'info';
  field: string;
  message: string;
  suggestion: string;
}

export interface FormValidationData {
  promptVersion: string;
  pageType: string;
  tonality: string;
  targetAudience: string;
  wordCount: string;
  maxParagraphLength: string;
  includeFAQ: boolean;
  keywordDensity?: string;
  complianceChecks?: {
    mdr?: boolean;
    hwg?: boolean;
    studies?: boolean;
  };
}

/**
 * Hauptvalidierungsfunktion
 */
export function validatePromptConsistency(data: FormValidationData): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Validierung 1: Prompt-Version vs. Tonalität
  const tonalityWarnings = validateTonalityConsistency(data.promptVersion, data.tonality);
  warnings.push(...tonalityWarnings);

  // Validierung 2: Prompt-Version vs. Textlänge
  const lengthWarnings = validateLengthConsistency(data.promptVersion, data.wordCount);
  warnings.push(...lengthWarnings);

  // Validierung 3: Marketing-First + Compliance = potenzieller Konflikt
  const complianceWarnings = validateComplianceConsistency(data.promptVersion, data.complianceChecks);
  warnings.push(...complianceWarnings);

  // Validierung 4: Minimal-Kreativ + strenge SEO-Parameter
  const creativityWarnings = validateCreativityConsistency(data.promptVersion, data);
  warnings.push(...creativityWarnings);

  // Validierung 5: B2B + Storytelling = möglicherweise zu emotional
  const audienceWarnings = validateAudienceConsistency(data.targetAudience, data.tonality, data.promptVersion);
  warnings.push(...audienceWarnings);

  return warnings;
}

/**
 * Validierung: Prompt-Version passt zur gewählten Tonalität?
 */
function validateTonalityConsistency(promptVersion: string, tonality: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // v1-kompakt-seo ist neutral, immer OK
  if (promptVersion === 'v1-kompakt-seo') return warnings;

  // v2-marketing-first sollte mit emotionalen Tonalitäten verwendet werden
  if (promptVersion === 'v2-marketing-first') {
    if (tonality === 'expertenmix') {
      warnings.push({
        severity: 'warning',
        field: 'promptVersion',
        message: 'Marketing-First Prompt + Experten-Tonalität',
        suggestion: 'Marketing-First fokussiert auf Emotionen. Expertenmix ist sehr fachlich. Erwägen Sie "Storytelling-Mix" oder "Conversion-Mix" für bessere Ergebnisse.'
      });
    }
  }

  // v4-minimal-kreativ braucht kreative Tonalitäten
  if (promptVersion === 'v4-minimal-kreativ') {
    if (tonality === 'expertenmix' || tonality === 'consultant-mix') {
      warnings.push({
        severity: 'info',
        field: 'promptVersion',
        message: 'Minimal-Kreativ Prompt mit formaler Tonalität',
        suggestion: 'Diese Prompt-Version ermöglicht maximale Kreativität. "Storytelling-Mix" oder "Balanced-Mix" könnten bessere Ergebnisse liefern.'
      });
    }
  }

  return warnings;
}

/**
 * Validierung: Textlänge vs. Prompt-Erwartungen
 */
function validateLengthConsistency(promptVersion: string, wordCount: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // v2-marketing-first braucht mehr Platz für Storytelling
  if (promptVersion === 'v2-marketing-first' && wordCount === 'short') {
    warnings.push({
      severity: 'warning',
      field: 'wordCount',
      message: 'Marketing-First + kurze Textlänge',
      suggestion: 'Marketing-First nutzt Storytelling und Emotionen, was mehr Platz benötigt. "Medium" oder "Long" empfohlen.'
    });
  }

  // v4-minimal-kreativ funktioniert auch mit kurzen Texten
  if (promptVersion === 'v4-minimal-kreativ' && wordCount === 'long') {
    warnings.push({
      severity: 'info',
      field: 'wordCount',
      message: 'Minimal-Kreativ + lange Textlänge',
      suggestion: 'Minimal-Kreativ ist für prägnante, mutige Texte optimiert. Kürzere Texte könnten wirkungsvoller sein.'
    });
  }

  return warnings;
}

/**
 * Validierung: Compliance-Checks vs. kreative Prompts
 */
function validateComplianceConsistency(
  promptVersion: string, 
  complianceChecks?: { mdr?: boolean; hwg?: boolean; studies?: boolean }
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (!complianceChecks) return warnings;

  const hasCompliance = complianceChecks.mdr || complianceChecks.hwg || complianceChecks.studies;

  // v2-marketing-first + Compliance = potenzieller Konflikt
  if (promptVersion === 'v2-marketing-first' && hasCompliance) {
    warnings.push({
      severity: 'warning',
      field: 'complianceChecks',
      message: 'Marketing-First + Compliance-Anforderungen',
      suggestion: 'Marketing-First nutzt emotionale Sprache, die mit MDR/HWG kollidieren kann. Erwägen Sie "Hybrid-Intelligent" oder "Kompakt-SEO" für regulierte Inhalte.'
    });
  }

  // v4-minimal-kreativ + Compliance = hohes Risiko
  if (promptVersion === 'v4-minimal-kreativ' && hasCompliance) {
    warnings.push({
      severity: 'warning',
      field: 'complianceChecks',
      message: 'Minimal-Kreativ + Compliance = Risiko!',
      suggestion: 'Minimal-Kreativ erlaubt mutige Experimente. Bei Compliance-Anforderungen NICHT empfohlen! Nutzen Sie "Kompakt-SEO" oder "Hybrid-Intelligent".'
    });
  }

  return warnings;
}

/**
 * Validierung: Kreative Freiheit vs. strikte SEO-Parameter
 */
function validateCreativityConsistency(promptVersion: string, data: FormValidationData): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (promptVersion !== 'v4-minimal-kreativ' && promptVersion !== 'v2-marketing-first') {
    return warnings;
  }

  // Sehr kurze Absätze + kreative Prompts = möglicher Konflikt
  if (parseInt(data.maxParagraphLength) < 200) {
    warnings.push({
      severity: 'info',
      field: 'maxParagraphLength',
      message: 'Kurze Absätze + kreativer Prompt',
      suggestion: 'Kreative Prompts nutzen Storytelling, was längere Absätze benötigt. 300 Wörter empfohlen.'
    });
  }

  // FAQ-Pflicht + Minimal-Kreativ = Widerspruch
  if (promptVersion === 'v4-minimal-kreativ' && data.includeFAQ) {
    warnings.push({
      severity: 'info',
      field: 'includeFAQ',
      message: 'Minimal-Kreativ generiert FAQ-Bereich',
      suggestion: 'FAQ ist strukturiert und formelhaft. Minimal-Kreativ bevorzugt unkonventionelle Formate.'
    });
  }

  return warnings;
}

/**
 * Validierung: Zielgruppe vs. Tonalität
 */
function validateAudienceConsistency(
  targetAudience: string, 
  tonality: string, 
  promptVersion: string
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // B2B + sehr emotionale Tonalität
  if (targetAudience === 'b2b' && tonality === 'storytelling-mix') {
    warnings.push({
      severity: 'info',
      field: 'tonality',
      message: 'B2B + Storytelling-Mix',
      suggestion: 'B2B-Entscheider bevorzugen oft Fakten. "Consultant-Mix" oder "Expertenmix" könnten besser konvertieren.'
    });
  }

  // B2C + sehr fachliche Tonalität
  if (targetAudience === 'b2c' && tonality === 'expertenmix' && promptVersion !== 'v1-kompakt-seo') {
    warnings.push({
      severity: 'info',
      field: 'tonality',
      message: 'B2C + Expertenmix',
      suggestion: 'B2C-Kunden bevorzugen verständliche Sprache. "Balanced-Mix" oder "Storytelling-Mix" empfohlen.'
    });
  }

  return warnings;
}

/**
 * Hilfsfunktion: Gibt benutzerfreundliche Warnungs-Anzahl zurück
 */
export function getValidationSummary(warnings: ValidationWarning[]): string {
  if (warnings.length === 0) {
    return '✅ Alle Einstellungen konsistent';
  }

  const criticalCount = warnings.filter(w => w.severity === 'warning').length;
  const infoCount = warnings.filter(w => w.severity === 'info').length;

  if (criticalCount > 0) {
    return `⚠️ ${criticalCount} Warnung${criticalCount > 1 ? 'en' : ''}, ${infoCount} Hinweis${infoCount !== 1 ? 'e' : ''}`;
  }

  return `ℹ️ ${infoCount} Hinweis${infoCount !== 1 ? 'e' : ''}`;
}
