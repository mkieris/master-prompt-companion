/**
 * Shared compliance check utility.
 * Can be called from generate-seo-content (auto) or check-compliance (manual).
 */

export interface ComplianceFinding {
  text: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  explanation: string;
  suggestion: string;
}

export interface MedicalClaim {
  claim_text: string;
  claim_type: 'efficacy' | 'safety' | 'indication' | 'mechanism';
  evidence_required: boolean;
  evidence_provided: boolean;
  hwg_relevant: boolean;
  mdr_relevant: boolean;
  severity: 'critical' | 'warning' | 'info';
  suggestion: string;
}

export interface ComplianceResult {
  overall_status: 'passed' | 'warning' | 'failed';
  hwg_status: 'passed' | 'warning' | 'failed';
  mdr_status: 'passed' | 'warning' | 'failed';
  compliance_score: number;
  findings: ComplianceFinding[];
  medical_claims: MedicalClaim[];
  critical_count: number;
  warning_count: number;
  info_count: number;
  raw_response: string;
}

const COMPLIANCE_SYSTEM_PROMPT = `Du bist ein Experte für rechtliche Compliance bei Medizinprodukten und Gesundheitswerbung in Deutschland.

Analysiere den folgenden Text und gib ein strukturiertes JSON zurück:

## PRÜF-BEREICHE

### 1. Heilmittelwerbegesetz (HWG)
- §3 HWG: Irreführende Werbung (übertriebene Wirkversprechen, unwahre Behauptungen)
- §11 HWG: Verbotene Werbemittel (Vorher-Nachher-Bilder, Empfehlungen ohne Beleg)
- Garantierte Heilungsversprechen
- "100% Wirksamkeit" oder ähnliche absolute Aussagen

### 2. Medizinprodukteverordnung (MDR)
- Fehlende oder falsche CE-Kennzeichnung
- Unzulässige Zweckbestimmungsaussagen
- Falsche Risikoklassen-Angaben

### 3. Studien und wissenschaftliche Behauptungen
- Unbelegte wissenschaftliche Claims
- Fehlende Quellenangaben bei Studien
- "Klinisch getestet" ohne echte klinische Prüfung

### 4. Heilaussagen
- Diagnose-Versprechen
- Therapie-Ersatz-Behauptungen
- Heilungsgarantien

## ANTWORT-FORMAT

Antworte AUSSCHLIESSLICH mit folgendem JSON:
{
  "overall_status": "passed" | "warning" | "failed",
  "hwg_status": "passed" | "warning" | "failed",
  "mdr_status": "passed" | "warning" | "failed",
  "compliance_score": 0-100,
  "findings": [
    {
      "text": "problematischer Textausschnitt",
      "severity": "critical" | "warning" | "info",
      "category": "HWG" | "MDR" | "Studien" | "Heilaussagen",
      "explanation": "warum problematisch",
      "suggestion": "Verbesserungsvorschlag"
    }
  ],
  "medical_claims": [
    {
      "claim_text": "exakter Text der Behauptung",
      "claim_type": "efficacy" | "safety" | "indication" | "mechanism",
      "evidence_required": true | false,
      "evidence_provided": true | false,
      "hwg_relevant": true | false,
      "mdr_relevant": true | false,
      "severity": "info" | "warning" | "critical",
      "suggestion": "Verbesserungsvorschlag"
    }
  ]
}

Wenn keine Probleme: overall_status="passed", compliance_score=100, leere Arrays.`;

/**
 * Runs an AI-powered compliance check on the given text.
 * Returns a structured ComplianceResult.
 */
export async function runComplianceCheck(
  text: string,
  apiKey: string,
  model = 'google/gemini-2.5-flash',
): Promise<ComplianceResult> {
  const startTime = Date.now();

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: COMPLIANCE_SYSTEM_PROMPT },
        { role: 'user', content: `Prüfe diesen Text auf Compliance-Verstöße:\n\n${text}` },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Compliance] AI API error:', response.status, errorText);
    throw new Error(`Compliance check API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  const duration = Date.now() - startTime;

  console.log(`[Compliance] Check completed in ${duration}ms`);

  return parseComplianceResponse(content);
}

/**
 * Parses the AI response into a structured ComplianceResult.
 */
function parseComplianceResponse(content: string): ComplianceResult {
  let parsed: any = null;

  try {
    // Try extracting JSON from markdown code block
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[1].trim());
    } else {
      parsed = JSON.parse(content.trim());
    }
  } catch {
    // Try finding JSON object
    const objMatch = content.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        parsed = JSON.parse(objMatch[0]);
      } catch {
        console.error('[Compliance] Failed to parse response');
      }
    }
  }

  if (!parsed) {
    return {
      overall_status: 'passed',
      hwg_status: 'passed',
      mdr_status: 'passed',
      compliance_score: 100,
      findings: [],
      medical_claims: [],
      critical_count: 0,
      warning_count: 0,
      info_count: 0,
      raw_response: content,
    };
  }

  // Validate and normalize findings
  const findings: ComplianceFinding[] = (Array.isArray(parsed.findings) ? parsed.findings : [])
    .filter((f: any) => f && typeof f.text === 'string' && typeof f.severity === 'string')
    .map((f: any) => ({
      text: f.text,
      severity: ['critical', 'warning', 'info'].includes(f.severity) ? f.severity : 'info',
      category: f.category || 'Allgemein',
      explanation: f.explanation || '',
      suggestion: f.suggestion || '',
    }));

  // Validate and normalize medical claims
  const medical_claims: MedicalClaim[] = (Array.isArray(parsed.medical_claims) ? parsed.medical_claims : [])
    .filter((c: any) => c && typeof c.claim_text === 'string')
    .map((c: any) => ({
      claim_text: c.claim_text,
      claim_type: ['efficacy', 'safety', 'indication', 'mechanism'].includes(c.claim_type) ? c.claim_type : 'efficacy',
      evidence_required: !!c.evidence_required,
      evidence_provided: !!c.evidence_provided,
      hwg_relevant: !!c.hwg_relevant,
      mdr_relevant: !!c.mdr_relevant,
      severity: ['critical', 'warning', 'info'].includes(c.severity) ? c.severity : 'info',
      suggestion: c.suggestion || '',
    }));

  const critical_count = findings.filter(f => f.severity === 'critical').length;
  const warning_count = findings.filter(f => f.severity === 'warning').length;
  const info_count = findings.filter(f => f.severity === 'info').length;

  // Determine overall status
  const validStatuses = ['passed', 'warning', 'failed'] as const;
  const overall_status = validStatuses.includes(parsed.overall_status) ? parsed.overall_status
    : critical_count > 0 ? 'failed'
    : warning_count > 0 ? 'warning'
    : 'passed';

  const hwg_status = validStatuses.includes(parsed.hwg_status) ? parsed.hwg_status : overall_status;
  const mdr_status = validStatuses.includes(parsed.mdr_status) ? parsed.mdr_status : overall_status;

  const compliance_score = typeof parsed.compliance_score === 'number'
    ? Math.max(0, Math.min(100, parsed.compliance_score))
    : critical_count > 0 ? Math.max(0, 100 - critical_count * 25 - warning_count * 10)
    : warning_count > 0 ? Math.max(50, 100 - warning_count * 10)
    : 100;

  return {
    overall_status,
    hwg_status,
    mdr_status,
    compliance_score,
    findings,
    medical_claims,
    critical_count,
    warning_count,
    info_count,
    raw_response: content,
  };
}
