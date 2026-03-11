/**
 * SEO Generator Form Validation & Field Mapping Validator
 * 
 * Prüft vor dem API-Call, ob alle kritischen Felder korrekt gemapped werden
 * zwischen Frontend (FormData) und Backend (Edge Function).
 */

export interface FormData {
  focusKeyword: string;
  secondaryKeywords: string[];
  wQuestions: string[];
  searchIntent: ("know" | "do" | "buy" | "go")[];
  keywordDensity: "low" | "medium" | "high" | "minimal" | "normal";
  pageType: "product" | "category";
  targetAudience: "endCustomers" | "physiotherapists";
  formOfAddress: "du" | "sie" | "neutral";
  contentLength: "short" | "medium" | "long";
  tone: string;
  manufacturerWebsite?: string;
  manufacturerInfo?: string;
  additionalInfo?: string;
  promptVersion: string;
  pageGoal: "inform" | "advise" | "preparePurchase" | "triggerPurchase";
  complianceCheck: boolean;
  checkMDR: boolean;
  checkHWG: boolean;
  checkStudies: boolean;
  faqInputs?: string;
  internalLinks?: string;
  briefingFiles?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  mappings: FieldMapping[];
  summary: ValidationSummary;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: "critical" | "error";
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface FieldMapping {
  frontendField: string;
  frontendValue: any;
  backendField: string;
  backendValue: any;
  status: "ok" | "mapped" | "missing" | "mismatch";
}

export interface ValidationSummary {
  totalFields: number;
  validFields: number;
  mappedFields: number;
  missingFields: number;
  errorCount: number;
  warningCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAPPING DEFINITIONS (mirrors backend logic)
// ═══════════════════════════════════════════════════════════════════════════════

const TONE_TO_TONALITY: Record<string, string> = {
  // English values (advanced forms)
  'factual': 'Sachlich & Informativ',
  'advisory': 'Beratend & Nutzenorientiert',
  'sales': 'Aktivierend & Überzeugend',
  // German values (BasicVersion)
  'sachlich': 'Sachlich & Informativ',
  'beratend': 'Beratend & Nutzenorientiert',
  'aktivierend': 'Aktivierend & Überzeugend'
};

const ADDRESS_STYLE_MAP: Record<string, string> = {
  'du': 'Verwende die Du-Form.',
  'sie': 'Verwende die Sie-Form.',
  'neutral': 'Vermeide direkte Anrede.'
};

const CONTENT_LENGTH_TO_WORDS: Record<string, number> = {
  'short': 400,
  'medium': 800,
  'long': 1200
};

const KEYWORD_DENSITY_MAP: Record<string, { min: number; max: number; label: string }> = {
  'minimal': { min: 0.003, max: 0.008, label: 'Minimal (0.3-0.8%) - sehr natürlich' },
  'low': { min: 0.003, max: 0.008, label: 'Minimal (0.3-0.8%) - sehr natürlich' },
  'normal': { min: 0.005, max: 0.015, label: 'Normal (0.5-1.5%) - SEO-optimiert' },
  'medium': { min: 0.005, max: 0.015, label: 'Normal (0.5-1.5%) - SEO-optimiert' },
  'high': { min: 0.015, max: 0.025, label: 'Hoch (1.5-2.5%) - aggressiv' }
};

const PAGE_GOAL_MAP: Record<string, string> = {
  'inform': 'INFORMIEREN - Wissen vermitteln, Fragen umfassend beantworten',
  'advise': 'BERATEN - Entscheidungshilfe geben, Optionen aufzeigen, Empfehlungen',
  'preparePurchase': 'KAUF VORBEREITEN - Vertrauen aufbauen, Bedenken ausräumen, Vorteile zeigen',
  'triggerPurchase': 'KAUF AUSLÖSEN - Dringlichkeit erzeugen, CTAs, zum Handeln motivieren'
};

const SEARCH_INTENT_MAP: Record<string, string> = {
  'know': 'Know (Informationssuche) → Mehr Erklärungen, Definitionen, How-Tos',
  'do': 'Do (Transaktional) → Mehr Anleitungen, Schritte, Aktionen',
  'buy': 'Buy (Kaufabsicht) → Mehr Vergleiche, Vorteile, CTAs',
  'go': 'Go (Navigation) → Marke prominent, direkte Infos'
};

const VALID_PROMPT_VERSIONS = [
  'v0-pre-alpha-experimental',
  'v0-alpha-basic',
  'v0-beta-tonality',
  'v0-rc-variants',
  'v1-kompakt-seo',
  'v2-marketing-first',
  'v3-hybrid-intelligent',
  'v4-minimal-kreativ',
  'v5-ai-meta-optimiert',
  'v6-quality-auditor',
  'v7-seo-content-master',
  'v8-natural-seo',
  'v8.1-sachlich',
  'v8.2-aktivierend',
  'v8.3-nahbar',
  'v9-master'
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN VALIDATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

export function validateFormData(formData: Partial<FormData>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const mappings: FieldMapping[] = [];

  // ═══ 1. CRITICAL FIELD: focusKeyword ═══
  if (!formData.focusKeyword?.trim()) {
    errors.push({
      field: 'focusKeyword',
      message: 'Fokus-Keyword ist erforderlich (Pflichtfeld)',
      severity: 'critical'
    });
  } else {
    mappings.push({
      frontendField: 'focusKeyword',
      frontendValue: formData.focusKeyword,
      backendField: 'focusKeyword',
      backendValue: formData.focusKeyword,
      status: 'ok'
    });

    // Keyword quality checks
    if (formData.focusKeyword.length < 3) {
      warnings.push({
        field: 'focusKeyword',
        message: 'Keyword sehr kurz - SEO-Effektivität möglicherweise eingeschränkt',
        suggestion: 'Verwenden Sie ein längeres, spezifischeres Keyword'
      });
    }
    if (formData.focusKeyword.length > 60) {
      warnings.push({
        field: 'focusKeyword',
        message: 'Keyword sehr lang - passt möglicherweise nicht in H1',
        suggestion: 'H1 sollte max. 60-70 Zeichen haben'
      });
    }
  }

  // ═══ 2. TONE → TONALITY MAPPING ═══
  if (formData.tone) {
    const mappedTonality = TONE_TO_TONALITY[formData.tone];
    if (mappedTonality) {
      mappings.push({
        frontendField: 'tone',
        frontendValue: formData.tone,
        backendField: 'tonality',
        backendValue: mappedTonality,
        status: 'mapped'
      });
    } else {
      warnings.push({
        field: 'tone',
        message: `Unbekannter Ton-Wert: "${formData.tone}" - Backend verwendet Fallback`,
        suggestion: 'Gültige Werte: factual, advisory, sales'
      });
      mappings.push({
        frontendField: 'tone',
        frontendValue: formData.tone,
        backendField: 'tonality',
        backendValue: 'Balanced-Mix (Fallback)',
        status: 'mismatch'
      });
    }
  } else {
    mappings.push({
      frontendField: 'tone',
      frontendValue: undefined,
      backendField: 'tonality',
      backendValue: 'Balanced-Mix (Default)',
      status: 'missing'
    });
  }

  // ═══ 3. FORM OF ADDRESS → ADDRESS STYLE ═══
  if (formData.formOfAddress) {
    const mappedAddress = ADDRESS_STYLE_MAP[formData.formOfAddress];
    if (mappedAddress) {
      mappings.push({
        frontendField: 'formOfAddress',
        frontendValue: formData.formOfAddress,
        backendField: 'addressStyle',
        backendValue: mappedAddress,
        status: 'mapped'
      });
    } else {
      errors.push({
        field: 'formOfAddress',
        message: `Ungültige Anrede: "${formData.formOfAddress}"`,
        severity: 'error'
      });
    }
  }

  // ═══ 4. CONTENT LENGTH → WORD COUNT ═══
  if (formData.contentLength) {
    const wordCount = CONTENT_LENGTH_TO_WORDS[formData.contentLength];
    if (wordCount) {
      const density = KEYWORD_DENSITY_MAP[formData.keywordDensity || 'medium'];
      const minKeywords = Math.ceil(wordCount * (density?.min || 0.005));
      const maxKeywords = Math.ceil(wordCount * (density?.max || 0.015));
      
      mappings.push({
        frontendField: 'contentLength',
        frontendValue: formData.contentLength,
        backendField: 'wordCount',
        backendValue: `${wordCount} Wörter (${minKeywords}-${maxKeywords} Keywords)`,
        status: 'mapped'
      });
    }
  }

  // ═══ 5. KEYWORD DENSITY ═══
  if (formData.keywordDensity) {
    const density = KEYWORD_DENSITY_MAP[formData.keywordDensity];
    if (density) {
      mappings.push({
        frontendField: 'keywordDensity',
        frontendValue: formData.keywordDensity,
        backendField: 'density',
        backendValue: density.label,
        status: 'mapped'
      });
    } else {
      warnings.push({
        field: 'keywordDensity',
        message: `Unbekannte Keyword-Dichte: "${formData.keywordDensity}"`,
        suggestion: 'Gültige Werte: low/minimal, medium/normal, high'
      });
    }
  }

  // ═══ 6. PAGE GOAL ═══
  if (formData.pageGoal) {
    const mappedGoal = PAGE_GOAL_MAP[formData.pageGoal];
    if (mappedGoal) {
      mappings.push({
        frontendField: 'pageGoal',
        frontendValue: formData.pageGoal,
        backendField: 'pageGoal (in Prompt)',
        backendValue: mappedGoal,
        status: 'mapped'
      });
    } else {
      warnings.push({
        field: 'pageGoal',
        message: `Unbekanntes Seitenziel: "${formData.pageGoal}"`,
        suggestion: 'Gültige Werte: inform, advise, preparePurchase, triggerPurchase'
      });
    }
  }

  // ═══ 7. TARGET AUDIENCE ═══
  if (formData.targetAudience) {
    const audienceInfo = formData.targetAudience === 'physiotherapists'
      ? 'B2B (Fachpersonal) → Fachsprache, Evidenzlevel, ICD-10/ICF'
      : 'B2C (Endkunden) → Einfache Sprache, emotionale Verbindung';
    
    mappings.push({
      frontendField: 'targetAudience',
      frontendValue: formData.targetAudience,
      backendField: 'audienceBlock',
      backendValue: audienceInfo,
      status: 'mapped'
    });
  }

  // ═══ 8. COMPLIANCE CHECKS ═══
  if (formData.complianceCheck) {
    const activeChecks: string[] = [];
    if (formData.checkMDR) activeChecks.push('MDR/MPDG');
    if (formData.checkHWG) activeChecks.push('HWG');
    if (formData.checkStudies) activeChecks.push('Studien-Zitierung');

    if (activeChecks.length === 0) {
      warnings.push({
        field: 'complianceCheck',
        message: 'Compliance aktiviert, aber keine spezifischen Checks ausgewählt',
        suggestion: 'Wählen Sie mindestens MDR, HWG oder Studien aus'
      });
      mappings.push({
        frontendField: 'complianceCheck',
        frontendValue: true,
        backendField: 'compliance',
        backendValue: 'Aktiviert aber leer',
        status: 'mismatch'
      });
    } else {
      mappings.push({
        frontendField: 'complianceCheck + checkMDR/HWG/Studies',
        frontendValue: { complianceCheck: true, checks: activeChecks },
        backendField: 'complianceBlock',
        backendValue: activeChecks.join(', '),
        status: 'mapped'
      });
    }
  }

  // ═══ 9. PROMPT VERSION ═══
  if (formData.promptVersion) {
    if (VALID_PROMPT_VERSIONS.includes(formData.promptVersion)) {
      const isHistorical = formData.promptVersion.startsWith('v0-');
      mappings.push({
        frontendField: 'promptVersion',
        frontendValue: formData.promptVersion,
        backendField: 'buildSystemPrompt()',
        backendValue: isHistorical 
          ? `${formData.promptVersion} → Fallback zu v1-kompakt-seo`
          : formData.promptVersion,
        status: isHistorical ? 'mismatch' : 'mapped'
      });

      if (isHistorical) {
        warnings.push({
          field: 'promptVersion',
          message: 'Historische Version ausgewählt - Backend verwendet v1-kompakt-seo',
          suggestion: 'Verwenden Sie v9-master für volle Funktionalität'
        });
      }
    } else {
      errors.push({
        field: 'promptVersion',
        message: `Unbekannte Prompt-Version: "${formData.promptVersion}"`,
        severity: 'error'
      });
    }
  }

  // ═══ 10. SEARCH INTENT ═══
  if (formData.searchIntent && formData.searchIntent.length > 0) {
    const mappedIntents = formData.searchIntent
      .map(i => SEARCH_INTENT_MAP[i])
      .filter(Boolean);
    
    mappings.push({
      frontendField: 'searchIntent',
      frontendValue: formData.searchIntent,
      backendField: 'searchIntent (in User-Prompt)',
      backendValue: mappedIntents.join(', '),
      status: 'mapped'
    });
  } else {
    mappings.push({
      frontendField: 'searchIntent',
      frontendValue: [],
      backendField: 'searchIntent',
      backendValue: 'Nicht gesetzt (optional)',
      status: 'missing'
    });
  }

  // ═══ 11. W-QUESTIONS ═══
  if (formData.wQuestions && formData.wQuestions.length > 0) {
    mappings.push({
      frontendField: 'wQuestions',
      frontendValue: formData.wQuestions,
      backendField: 'wQuestions (in User-Prompt)',
      backendValue: `${formData.wQuestions.length} Fragen → FAQ-Sektion`,
      status: 'mapped'
    });
  }

  // ═══ 12. SECONDARY KEYWORDS ═══
  if (formData.secondaryKeywords && formData.secondaryKeywords.length > 0) {
    mappings.push({
      frontendField: 'secondaryKeywords',
      frontendValue: formData.secondaryKeywords,
      backendField: 'secondaryKeywords',
      backendValue: formData.secondaryKeywords.join(', '),
      status: 'ok'
    });
  }

  // ═══ 13. MANUFACTURER INFO ═══
  if (formData.manufacturerInfo?.trim()) {
    const charCount = formData.manufacturerInfo.length;
    mappings.push({
      frontendField: 'manufacturerInfo',
      frontendValue: `${charCount} Zeichen`,
      backendField: 'manufacturerInfo (in User-Prompt)',
      backendValue: charCount > 3000 ? 'Gekürzt auf 3000 Zeichen' : 'Vollständig übernommen',
      status: 'mapped'
    });

    if (charCount > 3000) {
      warnings.push({
        field: 'manufacturerInfo',
        message: 'Herstellerinfo wird auf 3000 Zeichen gekürzt',
        suggestion: 'Kürzen Sie den Text auf die wichtigsten Informationen'
      });
    }
  }

  // ═══ 14. FAQ INPUTS ═══
  if (formData.faqInputs?.trim()) {
    const questions = formData.faqInputs.split('\n').filter(q => q.trim());
    mappings.push({
      frontendField: 'faqInputs',
      frontendValue: formData.faqInputs,
      backendField: 'faqInputs (parsed as array)',
      backendValue: `${questions.length} Fragen extrahiert`,
      status: 'mapped'
    });
  }

  // ═══ 15. PAGE TYPE ═══
  if (formData.pageType) {
    mappings.push({
      frontendField: 'pageType',
      frontendValue: formData.pageType,
      backendField: 'structureTemplate',
      backendValue: formData.pageType === 'product' 
        ? 'Produktseiten-Struktur' 
        : 'Kategorieseiten-Struktur',
      status: 'mapped'
    });
  }

  // ═══ BUILD SUMMARY ═══
  const summary: ValidationSummary = {
    totalFields: mappings.length,
    validFields: mappings.filter(m => m.status === 'ok').length,
    mappedFields: mappings.filter(m => m.status === 'mapped').length,
    missingFields: mappings.filter(m => m.status === 'missing').length,
    errorCount: errors.length,
    warningCount: warnings.length
  };

  return {
    isValid: errors.filter(e => e.severity === 'critical').length === 0,
    errors,
    warnings,
    mappings,
    summary
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export function formatValidationResult(result: ValidationResult): string {
  let output = '═══ VALIDIERUNGS-BERICHT ═══\n\n';
  
  output += `Status: ${result.isValid ? '✅ VALIDE' : '❌ UNGÜLTIG'}\n`;
  output += `Felder: ${result.summary.validFields + result.summary.mappedFields}/${result.summary.totalFields} korrekt\n`;
  output += `Fehler: ${result.summary.errorCount} | Warnungen: ${result.summary.warningCount}\n\n`;

  if (result.errors.length > 0) {
    output += '═══ FEHLER ═══\n';
    result.errors.forEach(e => {
      output += `❌ [${e.severity.toUpperCase()}] ${e.field}: ${e.message}\n`;
    });
    output += '\n';
  }

  if (result.warnings.length > 0) {
    output += '═══ WARNUNGEN ═══\n';
    result.warnings.forEach(w => {
      output += `⚠️ ${w.field}: ${w.message}\n`;
      if (w.suggestion) output += `   → ${w.suggestion}\n`;
    });
    output += '\n';
  }

  output += '═══ FELD-MAPPINGS ═══\n';
  result.mappings.forEach(m => {
    const icon = m.status === 'ok' || m.status === 'mapped' ? '✓' : 
                 m.status === 'missing' ? '○' : '✗';
    output += `${icon} ${m.frontendField} → ${m.backendField}\n`;
    output += `   Frontend: ${JSON.stringify(m.frontendValue)}\n`;
    output += `   Backend:  ${m.backendValue}\n`;
  });

  return output;
}

export function getValidationSummaryForUI(result: ValidationResult): {
  status: 'success' | 'warning' | 'error';
  title: string;
  description: string;
} {
  if (!result.isValid) {
    return {
      status: 'error',
      title: 'Validierung fehlgeschlagen',
      description: `${result.summary.errorCount} kritische Fehler gefunden`
    };
  }
  
  if (result.warnings.length > 0) {
    return {
      status: 'warning',
      title: 'Validierung mit Warnungen',
      description: `${result.summary.warningCount} Warnungen - Überprüfen Sie die Einstellungen`
    };
  }
  
  return {
    status: 'success',
    title: 'Validierung erfolgreich',
    description: `${result.summary.validFields + result.summary.mappedFields} Felder korrekt gemapped`
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK VALIDATION (for pre-submit check)
// ═══════════════════════════════════════════════════════════════════════════════

export function quickValidate(formData: Partial<FormData>): {
  canSubmit: boolean;
  message: string;
  details?: string[];
} {
  const issues: string[] = [];

  if (!formData.focusKeyword?.trim()) {
    issues.push('Fokus-Keyword fehlt');
  }

  if (!formData.tone || !TONE_TO_TONALITY[formData.tone]) {
    issues.push('Tonalität nicht korrekt gesetzt');
  }

  if (formData.complianceCheck && !formData.checkMDR && !formData.checkHWG && !formData.checkStudies) {
    issues.push('Compliance aktiviert aber keine Checks ausgewählt');
  }

  if (formData.promptVersion?.startsWith('v0-')) {
    issues.push('Historische Prompt-Version (Fallback aktiv)');
  }

  return {
    canSubmit: !formData.focusKeyword?.trim() ? false : true,
    message: issues.length === 0 
      ? 'Alle Felder korrekt' 
      : `${issues.length} Problem(e) gefunden`,
    details: issues.length > 0 ? issues : undefined
  };
}
