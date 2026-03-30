# Refactoring & Security Plan – Master Prompt Companion

**Erstellt:** 2026-03-23
**Status:** Draft
**Kontext:** K-Active Healthcare/Medtech Content AI Tool
**Ziel:** Produktionsreife durch Security-Fixes, Compliance-Verbesserungen und Code-Qualität

---

## Inhaltsverzeichnis

1. [Executive Summary](#1-executive-summary)
2. [Kritische Security-Fixes (Woche 1)](#2-kritische-security-fixes-woche-1)
3. [Healthcare Compliance (Woche 1–2)](#3-healthcare-compliance-woche-1-2)
4. [Frontend-Härtung (Woche 2)](#4-frontend-härtung-woche-2)
5. [Backend-Verbesserungen (Woche 2–3)](#5-backend-verbesserungen-woche-2-3)
6. [Code-Qualität & Testing (Woche 3–4)](#6-code-qualität--testing-woche-3-4)
7. [Architektur-Empfehlungen (Langfristig)](#7-architektur-empfehlungen-langfristig)
8. [Priorisierte Aufgabenliste](#8-priorisierte-aufgabenliste)

---

## 1. Executive Summary

Die Security-Analyse hat ergeben, dass die Anwendung **nicht produktionsreif** ist. Kritische Schwachstellen bestehen in:

- **Prompt Injection**: User-Input wird direkt in AI-Prompts interpoliert (kein Escaping)
- **CORS Wildcard**: Alle 14 Edge Functions erlauben `Access-Control-Allow-Origin: *`
- **Fehlender Audit Trail**: Compliance-Checks sind nicht mit Content-Generierungen verknüpft
- **Keine Route Protection**: Frontend-Routen prüfen keine Authentifizierung
- **Kein Rate Limiting**: Keine Begrenzung pro User/IP

**Empfehlung:** Kritische Fixes (Abschnitt 2 + 3) vor jedem Produktiv-Einsatz umsetzen.

---

## 2. Kritische Security-Fixes (Woche 1)

### 2.1 Prompt Injection Sanitization

**Problem:** User-Input (`focusKeyword`, `additionalInfo`, `secondaryKeywords`, `briefingContent`) wird ohne Escaping in AI-Prompts eingefügt.

**Betroffene Dateien:**
- `supabase/functions/generate-seo-content/index.ts` (Zeilen 523, 530, 707, 759, 833)

**Lösung:** Sanitization-Utility erstellen:

```typescript
// supabase/functions/_shared/sanitize-prompt-input.ts

/**
 * Entfernt potenziell gefährliche Prompt-Injection-Patterns aus User-Input.
 * - Escaped Backticks und Markdown-Code-Blöcke
 * - Entfernt "ignore previous instructions"-Patterns
 * - Begrenzt Länge
 */
export function sanitizePromptInput(input: string, maxLength = 500): string {
  if (!input) return '';

  let sanitized = input
    // Entferne typische Injection-Patterns
    .replace(/ignore\s+(all\s+)?previous\s+instructions/gi, '')
    .replace(/system:\s*/gi, '')
    .replace(/\buser:\s*/gi, '')
    .replace(/\bassistant:\s*/gi, '')
    // Escape Backticks (Markdown Code Blocks)
    .replace(/```/g, '\\`\\`\\`')
    // Entferne NULL-Bytes
    .replace(/\0/g, '');

  return sanitized.slice(0, maxLength);
}

export function sanitizePromptArray(items: string[], maxItems = 20, maxItemLength = 100): string[] {
  return items
    .slice(0, maxItems)
    .map(item => sanitizePromptInput(item, maxItemLength));
}
```

**Anwendung in `generate-seo-content/index.ts`:**
```typescript
// Vor Prompt-Erstellung:
const safeFocusKeyword = sanitizePromptInput(formData.focusKeyword, 200);
const safeAdditionalInfo = sanitizePromptInput(formData.additionalInfo, 10000);
const safeSecondaryKeywords = sanitizePromptArray(formData.secondaryKeywords || []);
const safeBriefingContent = sanitizePromptInput(briefingContent, 50000);
```

**Aufwand:** ~2h
**Priorität:** 🔴 KRITISCH

---

### 2.2 CORS Einschränkung

**Problem:** Alle 14 Edge Functions nutzen `Access-Control-Allow-Origin: '*'`.

**Betroffene Dateien:** Alle 14 `supabase/functions/*/index.ts`

**Lösung:** Shared CORS-Konfiguration:

```typescript
// supabase/functions/_shared/cors.ts

const ALLOWED_ORIGINS = [
  'https://k-active-app.example.com',  // Produktion
  'http://localhost:5173',               // Lokale Entwicklung
  'http://localhost:8080',               // Alternative Dev-Ports
];

export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin || '')
    ? requestOrigin!
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}
```

**Migration:** In jeder Edge Function:
```diff
- const corsHeaders = {
-   'Access-Control-Allow-Origin': '*',
-   'Access-Control-Allow-Headers': '...',
- };
+ import { getCorsHeaders } from '../_shared/cors.ts';
+ // In handler:
+ const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
```

**Aufwand:** ~3h (14 Dateien)
**Priorität:** 🔴 KRITISCH

---

### 2.3 Input-Validierung (Server-Side)

**Problem:** Minimale Validierung – nur Pflichtfelder werden geprüft.

**Lösung:** Zod-Schema für alle Edge Function Inputs:

```typescript
// supabase/functions/_shared/schemas.ts
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

export const generateContentSchema = z.object({
  focusKeyword: z.string().min(1).max(200).trim(),
  brandName: z.string().max(100).optional(),
  pageType: z.enum(['product', 'category', 'blog', 'landing', 'service']).default('product'),
  targetAudience: z.enum(['b2b', 'b2c', 'both']).default('b2c'),
  additionalInfo: z.string().max(50000).optional(),
  secondaryKeywords: z.array(z.string().max(100)).max(20).optional(),
  searchIntent: z.string().max(500).optional(),
  contentLength: z.enum(['short', 'medium', 'long']).default('medium'),
  organizationId: z.string().uuid().optional(),
});
```

**Aufwand:** ~2h
**Priorität:** 🔴 KRITISCH

---

## 3. Healthcare Compliance (Woche 1–2)

### 3.1 Audit Trail Datenbank-Schema

**Problem:** Compliance-Checks sind nicht mit `content_generations` verknüpft. Keine Nachvollziehbarkeit für MDR/HWG.

**Lösung:** Neue Tabellen:

```sql
-- Migration: add_compliance_audit_trail.sql

CREATE TABLE compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES content_generations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ai_model TEXT NOT NULL,
  prompt_version TEXT,

  -- Ergebnis
  overall_status TEXT NOT NULL CHECK (overall_status IN ('passed', 'warning', 'failed')),
  hwg_status TEXT NOT NULL CHECK (hwg_status IN ('passed', 'warning', 'failed')),
  mdr_status TEXT NOT NULL CHECK (mdr_status IN ('passed', 'warning', 'failed')),

  -- Details
  violations JSONB NOT NULL DEFAULT '[]',
  -- Format: [{ "type": "hwg_cure_guarantee", "claim": "heilt Diabetes", "severity": "critical", "suggestion": "..." }]

  raw_ai_response JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_generation ON compliance_checks(generation_id);
CREATE INDEX idx_compliance_user ON compliance_checks(user_id);

-- RLS
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own compliance checks"
  ON compliance_checks FOR SELECT
  USING (auth.uid() = user_id);
```

**Aufwand:** ~4h
**Priorität:** 🔴 KRITISCH für Healthcare

---

### 3.2 Compliance-Check Integration

**Problem:** `check-compliance` Edge Function ist standalone – keine Verknüpfung.

**Lösung:** Nach jeder Content-Generierung automatisch Compliance-Check triggern und speichern:

```typescript
// In generate-seo-content/index.ts nach erfolgreicher Generierung:

// 1. Content generieren (wie bisher)
const generationResult = await generateContent(/* ... */);

// 2. In content_generations speichern (wie bisher)
const { data: generation } = await supabase
  .from('content_generations')
  .insert({ /* ... */ })
  .select('id')
  .single();

// 3. NEU: Automatischer Compliance-Check
const complianceResult = await checkCompliance(generationResult.content);

// 4. NEU: Compliance-Ergebnis speichern
await supabase.from('compliance_checks').insert({
  generation_id: generation.id,
  user_id: user.id,
  ai_model: modelUsed,
  prompt_version: promptVersion,
  overall_status: complianceResult.status,
  hwg_status: complianceResult.hwg,
  mdr_status: complianceResult.mdr,
  violations: complianceResult.violations,
});

// 5. Compliance-Info im Response mitgeben
return new Response(JSON.stringify({
  ...generationResult,
  compliance: {
    status: complianceResult.status,
    violations: complianceResult.violations,
  }
}));
```

**Aufwand:** ~4h
**Priorität:** 🔴 KRITISCH für Healthcare

---

### 3.3 Medical Claims Tracking

**Problem:** Keine Möglichkeit, spezifische medizinische Behauptungen zu identifizieren und nachzuverfolgen.

**Lösung:** Claims-Extraktion im Compliance-Check erweitern:

```typescript
// Erweiterung des Compliance-Check System Prompts:
const COMPLIANCE_SYSTEM_PROMPT = `
Du bist ein HWG/MDR Compliance-Prüfer für medizinische Inhalte.

Analysiere den folgenden Text und gib ein strukturiertes JSON zurück:

{
  "overall_status": "passed" | "warning" | "failed",
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
  ],
  "violations": [...]
}
`;
```

**Aufwand:** ~3h
**Priorität:** 🟠 HOCH

---

## 4. Frontend-Härtung (Woche 2)

### 4.1 Route Protection

**Problem:** `src/App.tsx` (Zeilen 64–89) – Alle Routen sind ohne Auth-Check zugänglich.

**Lösung:** ProtectedRoute-Komponente erstellen:

```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';

interface Props {
  session: Session | null;
  children: React.ReactNode;
}

export function ProtectedRoute({ session, children }: Props) {
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}
```

**Anwendung in `App.tsx`:**
```diff
- <Route path="/dashboard" element={<Dashboard session={session} />}>
+ <Route path="/dashboard" element={
+   <ProtectedRoute session={session}>
+     <Dashboard session={session} />
+   </ProtectedRoute>
+ }>
```

**Aufwand:** ~1h
**Priorität:** 🟠 HOCH

---

### 4.2 Frontend Input-Validierung

**Problem:** `ContentCreator.tsx` (Zeile 228) – Nur Leer-Check auf `focusKeyword`.

**Lösung:** Validierung vor API-Aufruf:

```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const contentConfigSchema = z.object({
  focusKeyword: z.string()
    .min(1, 'Keyword ist erforderlich')
    .max(200, 'Keyword darf maximal 200 Zeichen haben')
    .regex(/^[^<>{}]*$/, 'Ungültige Zeichen im Keyword'),
  brandName: z.string().max(100).optional(),
  additionalInfo: z.string().max(50000).optional(),
  secondaryKeywords: z.array(z.string().max(100)).max(20).optional(),
});

export function validateContentConfig(config: unknown) {
  return contentConfigSchema.safeParse(config);
}
```

**Aufwand:** ~2h
**Priorität:** 🟠 HOCH

---

### 4.3 innerHTML-Bereinigung

**Problem:** `src/components/ProSteps/Step5AfterCheck.tsx:549` – `temp.innerHTML = html` Pattern.

**Lösung:**
```diff
- const temp = document.createElement('div');
- temp.innerHTML = html;
- return temp.textContent || temp.innerText || '';
+ // Sicherer: DOMParser statt innerHTML
+ const parser = new DOMParser();
+ const doc = parser.parseFromString(html, 'text/html');
+ return doc.body.textContent || '';
```

**Aufwand:** ~30min
**Priorität:** 🟡 MITTEL

---

## 5. Backend-Verbesserungen (Woche 2–3)

### 5.1 Rate Limiting

**Problem:** Kein Rate Limiting auf Edge Functions.

**Lösung:** Datenbank-basiertes Rate Limiting:

```sql
-- Migration: add_rate_limiting.sql
CREATE TABLE rate_limits (
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,  -- 'generate_content', 'analyze_serp', etc.
  window_start TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, action, window_start)
);
```

```typescript
// supabase/functions/_shared/rate-limit.ts
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  maxRequests: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('window_start', windowStart.toISOString());

  const current = count || 0;

  if (current >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Zähler erhöhen
  await supabase.from('rate_limits').insert({
    user_id: userId,
    action,
    window_start: new Date().toISOString(),
  });

  return { allowed: true, remaining: maxRequests - current - 1 };
}
```

**Limits (Vorschlag):**
| Action | Max Requests | Window |
|--------|-------------|--------|
| `generate_content` | 20 | 60 min |
| `analyze_serp` | 50 | 60 min |
| `check_compliance` | 30 | 60 min |
| `scrape_website` | 10 | 60 min |

**Aufwand:** ~4h
**Priorität:** 🟠 HOCH

---

### 5.2 Supabase Queries einschränken

**Problem:** Viele `select('*')` Aufrufe – unnötige Daten werden übertragen.

**Betroffene Dateien (Beispiele):**
- `src/pages/Projects.tsx`
- `src/pages/GenerationAnalytics.tsx`
- `src/pages/GenerationHistory.tsx`
- `src/pages/ContentCreator.tsx`
- `src/hooks/useOrganization.ts`

**Lösung:** Explizite Spaltenauswahl:
```diff
- const { data } = await supabase.from('content_generations').select('*');
+ const { data } = await supabase.from('content_generations').select('id, focus_keyword, created_at, success, content_score');
```

**Aufwand:** ~3h
**Priorität:** 🟡 MITTEL

---

### 5.3 Error Logging Sanitization

**Problem:** Fehler-Logs könnten sensible Daten enthalten.

**Lösung:**
```typescript
// supabase/functions/_shared/safe-log.ts
export function safeLogError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  // Keine vollständigen Payloads loggen
  console.error(`[${context}] Error: ${message}`);
}
```

**Aufwand:** ~1h
**Priorität:** 🟡 MITTEL

---

## 6. Code-Qualität & Testing (Woche 3–4)

### 6.1 Unit Tests für Content Score

**Status:** Im CLAUDE.md als TODO markiert.

**Zu testen:**
- Score-Berechnung bei leerem Content → 0
- Score-Berechnung bei perfektem Content → 100
- SERP Terms Gewichtung (mustHave, shouldHave, niceToHave)
- Edge Cases (sehr langer Content, Sonderzeichen)

**Dateien:**
```
src/__tests__/content-score.test.ts
src/__tests__/sanitize.test.ts
src/__tests__/validation.test.ts
```

**Aufwand:** ~4h
**Priorität:** 🟡 MITTEL

---

### 6.2 E2E Tests für Generation Flow

**Status:** Im CLAUDE.md als TODO markiert.

**Test-Szenarien:**
1. User gibt Keyword ein → SERP-Analyse startet
2. User klickt "Generieren" → Content wird erstellt
3. Content Score aktualisiert sich
4. Compliance-Check zeigt Ergebnisse

**Aufwand:** ~6h
**Priorität:** 🟡 MITTEL

---

### 6.3 Structured Logging

**Status:** Im CLAUDE.md als TODO markiert.

**Lösung:** Einheitliches Log-Format:
```typescript
// supabase/functions/_shared/logger.ts
export function log(level: 'info' | 'warn' | 'error', event: string, data?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data,
  };
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(entry));
}
```

**Aufwand:** ~2h
**Priorität:** 🟡 MITTEL

---

## 7. Architektur-Empfehlungen (Langfristig)

### 7.1 Compliance Approval Workflow
- Admin-Dashboard für Compliance-Reviews
- Genehmigungs-Workflow vor Veröffentlichung
- Eskalation bei kritischen HWG-Verstößen

### 7.2 Evidence Retention System
- Medizinische Behauptungen mit Quellen verknüpfen
- Studien-Referenzen in Datenbank speichern
- Automatische Prüfung ob Belege vorhanden

### 7.3 Content Versioning
- Diff-Tracking zwischen Generierungen
- Korrektur-Historie nach Compliance-Checks
- Rollback-Möglichkeit

---

## 8. Priorisierte Aufgabenliste

### 🔴 Woche 1 – Kritische Security-Fixes

| # | Aufgabe | Datei(en) | Aufwand |
|---|---------|-----------|---------|
| 1 | Prompt Injection Sanitization | `_shared/sanitize-prompt-input.ts`, `generate-seo-content/index.ts` | 2h |
| 2 | CORS Einschränkung | Alle 14 Edge Functions + `_shared/cors.ts` | 3h |
| 3 | Server-Side Input-Validierung (Zod) | `_shared/schemas.ts`, `generate-seo-content/index.ts` | 2h |
| 4 | Compliance Audit Trail DB-Schema | SQL Migration | 2h |
| 5 | Compliance-Check ↔ Generation Verknüpfung | `generate-seo-content/index.ts`, `check-compliance/index.ts` | 4h |

### 🟠 Woche 2 – Hohe Priorität

| # | Aufgabe | Datei(en) | Aufwand |
|---|---------|-----------|---------|
| 6 | Frontend Route Protection | `src/components/auth/ProtectedRoute.tsx`, `src/App.tsx` | 1h |
| 7 | Frontend Input-Validierung | `src/lib/validation.ts`, `ContentCreator.tsx` | 2h |
| 8 | Rate Limiting | `_shared/rate-limit.ts`, DB Migration, Edge Functions | 4h |
| 9 | Medical Claims Tracking | `check-compliance/index.ts` | 3h |

### 🟡 Woche 3–4 – Mittlere Priorität

| # | Aufgabe | Datei(en) | Aufwand |
|---|---------|-----------|---------|
| 10 | innerHTML → DOMParser | `Step5AfterCheck.tsx` | 0.5h |
| 11 | Supabase Queries einschränken | Diverse Pages + Hooks | 3h |
| 12 | Error Logging Sanitization | `_shared/safe-log.ts` | 1h |
| 13 | Unit Tests (Content Score, Sanitize) | `src/__tests__/` | 4h |
| 14 | E2E Tests (Generation Flow) | `src/__tests__/e2e/` | 6h |
| 15 | Structured Logging | `_shared/logger.ts` | 2h |

### Gesamt: ~39.5h geschätzt

---

## Referenzen

- **OWASP Top 10 (2023)**: Injection, Broken Access Control, Security Misconfiguration
- **MDR (EU) 2017/745**: Medical Device Regulation – Dokumentationspflichten
- **HWG §§ 1–12**: Heilmittelwerbegesetz – Werbebeschränkungen für Medizinprodukte
- **Supabase Security Best Practices**: RLS, Auth, CORS

---

*Dieser Plan basiert auf der Security-Analyse vom 2026-03-23. Alle kritischen Findings sollten vor einem produktiven Einsatz behoben werden.*
