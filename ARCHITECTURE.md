# Master Prompt Companion — Technische Dokumentation

**Stand:** 2026-03-31
**Branch:** `claude/code-review-bHvzx`
**Projekt:** K-Active SEO Content Tool (Lovable Cloud + Supabase)

---

## 1. Projektübersicht

SEO-Content-Generator für K-Active (Medtech, Kinesiologie-Tapes, Recovery-Produkte). Zwei Content-Creator existieren parallel:

- **V1** (`/content`) – Vollständiger Editor mit 19 Formularfeldern, SERP-Analyse, Compliance-Checks, Content Score
- **V2** (`/content-v2`) – Vereinfachter Generator mit 6 Feldern, K-Active Brand Voice, Claude Sonnet direkt

### Tech-Stack

| Komponente | Technologie |
|---|---|
| Frontend | React 18.3 + TypeScript 5.8 + Vite 5.4 |
| UI | shadcn/ui (Radix) + Tailwind CSS 3.4 |
| Backend | Supabase (Lovable Cloud) |
| AI (V2) | Claude Sonnet 4 via Anthropic API direkt |
| AI (V1) | Gemini Flash/Pro via Lovable Gateway + Claude optional |
| SERP | Serper.dev API |
| Crawling | Firecrawl API |
| Testing | Vitest + React Testing Library |

### API Keys (Supabase Secrets)

| Key | Verwendung |
|---|---|
| `ANTHROPIC_API_KEY` | Claude Sonnet (V2 + V1 optional) |
| `LOVABLE_API_KEY` | Gemini Flash/Pro via Lovable Gateway |
| `SERPER_API_KEY` | Google SERP-Analyse |
| `FIRECRAWL_API_KEY` | Website-Crawling |
| `APIFY_API_KEY` | Scraping (Legacy) |

---

## 2. Dateistruktur

```
/
├── src/
│   ├── pages/                    # 22 Seiten
│   │   ├── ContentCreator.tsx    # V1 Editor (911 Zeilen)
│   │   ├── ContentCreatorV2.tsx  # V2 Simplified (350 Zeilen)
│   │   ├── Dashboard.tsx         # Container mit Nested Routes
│   │   ├── Auth.tsx              # Login/Signup
│   │   ├── Index.tsx             # Startseite
│   │   ├── SEOCheck.tsx          # SEO-Audit Tool
│   │   ├── GenerationAnalytics.tsx
│   │   ├── GenerationHistory.tsx
│   │   ├── DomainLearning.tsx
│   │   ├── Projects.tsx
│   │   ├── ContentPlanner.tsx
│   │   ├── AIContentCreator.tsx
│   │   ├── AdminInsights.tsx
│   │   ├── SystemPromptVersions.tsx
│   │   ├── UserPromptVersions.tsx
│   │   ├── SloganCreator.tsx
│   │   └── ...
│   ├── components/
│   │   ├── content-creator/      # V1 Komponenten
│   │   │   ├── ConfigPanel.tsx   # 19-Felder Konfiguration
│   │   │   ├── ContentEditor.tsx # Editor mit Tabs
│   │   │   ├── ContentScorePanel.tsx # SEO Score 0-100
│   │   │   ├── ComplianceBanner.tsx  # MDR/HWG Compliance
│   │   │   └── types.ts
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── debug/
│   │   │   └── DebugPanel.tsx    # Floating Debug-Panel
│   │   └── ui/                   # shadcn/ui Komponenten
│   ├── hooks/
│   │   ├── useOrganization.ts    # Org/Profile Management
│   │   ├── useSerpAnalysis.ts    # SERP-Analyse
│   │   ├── useDebounce.ts
│   │   ├── use-toast.ts
│   │   └── use-mobile.tsx
│   ├── utils/
│   │   ├── content-score.ts      # Score-Berechnung (getestet)
│   │   └── content-score.test.ts # 34 Unit Tests
│   ├── lib/
│   │   ├── sanitize.ts           # DOMPurify HTML Sanitization
│   │   └── validation.ts         # Zod Frontend-Validierung
│   ├── contexts/
│   │   └── DebugContext.tsx       # Debug Event Logging
│   └── integrations/supabase/
│       ├── client.ts             # Supabase Client
│       └── types.ts              # Auto-generated DB Types
├── supabase/
│   ├── functions/
│   │   ├── generate-content-v2/  # V2 Edge Function (NEU)
│   │   ├── generate-seo-content/ # V1 Edge Function (3700 Zeilen)
│   │   ├── generate-ai-content/  # Generic AI Content
│   │   ├── analyze-serp/         # SERP-Analyse (Serper.dev)
│   │   ├── analyze-keyword/      # Keyword-Analyse
│   │   ├── analyze-competitor/   # Wettbewerber-Analyse
│   │   ├── analyze-domain/       # Domain Learning
│   │   ├── scrape-website/       # Website Crawling (Firecrawl)
│   │   ├── crawl-domain/         # Domain Crawling
│   │   ├── check-compliance/     # MDR/HWG Compliance
│   │   ├── check-ai-text/        # KI-Text-Erkennung
│   │   ├── ai-content-chat/      # Chat-Interface
│   │   ├── generate-insights/    # Analytics
│   │   ├── generate-slogans/     # Slogan-Generator
│   │   ├── seo-check/            # SEO-Audit
│   │   └── _shared/
│   │       └── cors.ts           # CORS Headers (Allow-Origin: *)
│   └── migrations/               # 33 SQL Migrationen
└── package.json
```

---

## 3. Routen

| Route | Seite | Auth | Beschreibung |
|---|---|---|---|
| `/` | Index | Ja | Startseite mit Tool-Karten |
| `/content` | ContentCreator | Ja | V1 Content Editor |
| `/content-v2` | ContentCreatorV2 | Ja | V2 Simplified Generator |
| `/auth` | Auth | Nein | Login/Signup |
| `/seo-check` | SEOCheck | Ja | SEO-Audit Tool |
| `/onboarding` | Onboarding | Ja | Ersteinrichtung |
| `/dashboard` | Dashboard | Ja | Container für Sub-Routes |
| `/dashboard/domain` | DomainLearning | Ja | Brand Knowledge |
| `/dashboard/projects` | Projects | Ja | Projekte |
| `/dashboard/planner` | ContentPlanner | Ja | Content-Kalender |
| `/dashboard/ai-content` | AIContentCreator | Ja | AI Content |
| `/dashboard/history` | GenerationHistory | Ja | Generierungs-Historie |
| `/dashboard/analytics` | GenerationAnalytics | Ja | Analytics Dashboard |
| `/dashboard/insights` | AdminInsights | Ja | Admin Insights |
| `/dashboard/system-prompts` | SystemPromptVersions | Ja | Prompt-Versionen |

---

## 4. Content Creator V2 — Detailbeschreibung

### 4.1 Frontend (ContentCreatorV2.tsx)

**Layout:** Split-Panel (380px Links: Eingabe | Rest: Output)

**6 Eingabefelder:**

| Feld | Typ | Pflicht | Optionen |
|---|---|---|---|
| Produkt/Thema | Input | Ja | Freitext |
| Fokus-Keyword | Input | Ja | Freitext + SERP-Indikator |
| Zielgruppe | Toggle | Ja | B2C / B2B |
| Textlänge | Select | Ja | 800 / 1500 / 2500 |
| Seitentyp | Select | Ja | Produkt / Kategorie / Marke / Ratgeber |
| Zusatzinfos | Textarea | Nein | Freitext (max 10.000 Zeichen) |

**4 Output-Tabs:**

1. **SEO-Text** — HTML-Vorschau + Copy HTML/Plaintext
2. **Meta-Daten** — Title + Description mit Zeichenzähler + Google Preview
3. **FAQ** — Karten + Copy als HTML / JSON-LD
4. **Prompt** — System & User Prompt einsehbar + kopierbar

**Footer Stats:** Wörter | Keywords | Dichte | H2-Anzahl | Lesezeit | Model | Dauer

### 4.2 Edge Function (generate-content-v2)

**Ablauf:**

```
Request → Auth → Validate → SERP Lookup → Build Prompts → Anthropic API → Parse JSON → Response
```

**Prompt-Architektur:**

```
SYSTEM PROMPT (~300 Wörter, dynamisch)
├── Rolle: SEO-Content-Stratege, Healthcare-Spezialisierung
├── Brand: K-Active Positionierung (therapeutischer Ursprung)
├── Brand Voice: Unternehmensperspektive, nie Ich-Form
├── Tonfall: Kompetent + nahbar
├── {audienceToggle}: B2C oder B2B spezifisch
├── Compliance: MDR/HWG Regeln
├── {dynamicStructure}: Wörter-Tabelle per Seitentyp
├── Keywords: Platzierung + Dichte-Range
├── Stil: Satzlängen, Aktiv/Passiv, Verbotene Phrasen
├── {contextBlock}: SERP-Begriffe (wenn vorhanden)
└── Output-Format: JSON-Schema

USER PROMPT (~50 Wörter)
├── Marke: K-Active
├── Produkt: {productName}
├── Fokus-Keyword: {focusKeyword}
├── Suchintention: Know + Buy
├── Zusatzinfos: {additionalInfo} (optional)
└── Anweisung: "Schreibe jetzt. Nur valides JSON."
```

**Seitentyp-Strukturen (Wort-Verteilung):**

**Produktseite:**
| Block | Anteil |
|---|---|
| Einstieg (Hook + Keyword) | 8% |
| Haupt-USP | 15% |
| Für wen? Anwendungsszenarien | 18% |
| Anwendung & Praxis | 15% |
| Qualität, Wissenschaft & Vertrauen | 12% |
| Vorteile auf einen Blick | 8% |
| FAQ (5+ W-Fragen) | 18% |
| Abschluss mit CTA | 6% |

**Kategorieseite (Thema):**
| Block | Anteil |
|---|---|
| Was ist [Kategorie]? | 8% |
| Wie funktioniert es? Wirkprinzip + Therapie-Hintergrund | 16% |
| Anwendungsgebiete: Beschwerden/Ziele, Szenarien | 16% |
| Produkttypen: Varianten, Unterschiede, K-Active Sortiment | 18% |
| Auswahlhilfe: Kaufkriterien, Fehler vermeiden | 14% |
| Qualität & Sicherheit: MDR, Zertifizierungen | 8% |
| FAQ | 14% |
| Abschluss + CTA zum Sortiment | 6% |

**Markenseite (Brand):**
| Block | Anteil |
|---|---|
| Marke in einem Satz positionieren | 8% |
| Markengeschichte: Gründung, Ursprung, Mission | 14% |
| Was macht die Marke besonders? Philosophie, Werte | 14% |
| Produktwelt: Linien/Kategorien mit Highlights | 18% |
| Technologie & Innovation | 12% |
| Für wen? Zielgruppen und Einsatzbereiche | 12% |
| Vertrauen: Zertifizierungen, Studien, Empfehlungen | 8% |
| FAQ | 8% |
| Abschluss + CTA | 6% |

**Ratgeber:**
| Block | Anteil |
|---|---|
| Einstieg (Hook + Keyword) | 8% |
| Was ist [Thema]? Definition | 15% |
| Ursachen / Hintergründe | 15% |
| Behandlung / Lösung | 18% |
| Praktische Tipps für den Alltag | 15% |
| Wann zum Arzt / Therapeuten? | 7% |
| FAQ | 16% |
| Abschluss | 6% |

**AI-Einstellungen:**

| Parameter | Wert |
|---|---|
| Model | claude-sonnet-4-20250514 |
| Temperature | 0.75 |
| max_tokens | dynamisch (wordCount × 1.3 + 800 + 20%) |
| Timeout | 90 Sekunden |
| API | https://api.anthropic.com/v1/messages |

### 4.3 SERP-Daten Integration

**Tabelle `serp_keywords`:**

```sql
keyword          TEXT UNIQUE
must_have_terms  TEXT[]  -- Pflicht-Begriffe
recommended_terms TEXT[] -- Empfohlene (70% Abdeckung)
optional_terms   TEXT[]  -- Zur Differenzierung
competitor_titles TEXT[] -- Top-10 Titel als Orientierung
common_questions  TEXT[] -- FAQ-Themen
```

**Ablauf:** Keyword eingeben → Supabase Lookup → Grüner Haken wenn gefunden → Begriffe automatisch im Prompt

---

## 5. Content Creator V1 — Überblick

**Edge Function:** `generate-seo-content` (3700 Zeilen)
**9 Prompt-Versionen:** v1, v2, v6, v8, v9, v10, v11, v12, v13 (Default: v13)
**19 Formularfelder** inkl. Tonalität, Anredeform, Keyword-Dichte, Prompt-Version
**AI Models:** Gemini Flash (Default), Gemini Pro, Claude Sonnet
**Features:** SERP-Analyse, Domain Knowledge, Research URLs, Outline-Generierung, Compliance-Check, Content Score

---

## 6. Datenbank-Schema

### Tabellen

| Tabelle | Beschreibung | RLS |
|---|---|---|
| `organizations` | Unternehmen/Teams | Ja |
| `profiles` | User-Profile | Ja |
| `organization_members` | Mitgliedschaften + Rollen | Ja |
| `domain_knowledge` | Brand Voice, USPs, AI Summary | Ja |
| `content_generations` | Generierungs-Tracking | Ja |
| `compliance_checks` | MDR/HWG Audit Trail | Ja |
| `rate_limits` | API Rate Limiting | Ja |
| `serp_keywords` | SERP-Daten pro Keyword | Ja |
| `content_projects` | Projekte | Ja |
| `content_plans` | Content-Kalender | Ja |
| `competitor_analyses` | Wettbewerber-Analysen | Ja |
| `prompt_insights` | Prompt-Optimierung | Ja |
| `system_prompt_versions` | Prompt-Versionen | Ja |
| `user_prompt_templates` | User-Templates | Ja |

### Views

| View | Beschreibung |
|---|---|
| `prompt_version_analytics` | Performance pro Prompt-Version (30 Tage) |
| `daily_generation_stats` | Tägliche Generierungs-Statistiken |
| `compliance_overview` | Compliance-Status aggregiert |

---

## 7. Edge Functions — Übersicht

| Function | Zweck | API | Key |
|---|---|---|---|
| `generate-content-v2` | V2 Content-Generierung | Anthropic | ANTHROPIC_API_KEY |
| `generate-seo-content` | V1 Content-Generierung | Anthropic + Lovable GW | Beide |
| `generate-ai-content` | Generic AI Content | Anthropic + Lovable GW | Beide |
| `analyze-serp` | Google SERP-Analyse | Serper.dev | SERPER_API_KEY |
| `analyze-keyword` | Keyword-Analyse | Lovable GW | LOVABLE_API_KEY |
| `analyze-competitor` | Wettbewerber-Analyse | Lovable GW | LOVABLE_API_KEY |
| `analyze-domain` | Domain Learning | Lovable GW | LOVABLE_API_KEY |
| `scrape-website` | Website Crawling | Firecrawl | FIRECRAWL_API_KEY |
| `crawl-domain` | Domain Crawling | Firecrawl | FIRECRAWL_API_KEY |
| `check-compliance` | MDR/HWG Prüfung | Lovable GW | LOVABLE_API_KEY |
| `check-ai-text` | KI-Text Erkennung | Lovable GW | LOVABLE_API_KEY |
| `ai-content-chat` | Chat-Interface | Lovable GW | LOVABLE_API_KEY |
| `generate-insights` | Analytics | Lovable GW | LOVABLE_API_KEY |
| `generate-slogans` | Slogan-Generator | Lovable GW | LOVABLE_API_KEY |
| `seo-check` | SEO-Audit | Lovable GW | LOVABLE_API_KEY |

---

## 8. Bekannte Einschränkungen

1. **Claude Sonnet Timeout:** Bei 2500+ Wörtern kann das 90s-Timeout erreicht werden
2. **Lovable Deployment:** GitHub-Merges werden nicht automatisch deployed — Lovable muss manuell synchronisieren
3. **_shared/ Dateien:** Nur `cors.ts` wird zuverlässig von Lovable deployed. Andere _shared Dateien (`rate-limit.ts`, `compliance-check.ts`, `sanitize-prompt-input.ts`) existieren im Repo aber nicht in Lovable
4. **DB-Tabellen:** `content_generations` und `compliance_checks` existieren möglicherweise nicht in Lovable Cloud (404 in Logs)
5. **SERP-Daten:** `serp_keywords` Tabelle muss manuell in Lovable Cloud → Database angelegt werden
6. **Kein Produkt-Briefing:** Claude hat kein spezifisches Wissen über K-Active Produkte — User muss Details ins Zusatzinfos-Feld kopieren

---

## 9. Geplante Features

| Feature | Status | Beschreibung |
|---|---|---|
| Research Pipeline | Geplant | Auto-Recherche via Serper + Firecrawl vor Generierung |
| Produkt-Datenbank | Geplant | `products` Tabelle mit automatischem Lookup |
| Two-Stage Compliance | Geplant | Stage 2 prüft generierten Text auf MDR/HWG |
| Forbidden Phrases DB | Geplant | `forbidden_phrases` Tabelle + Admin UI |
| Structured Logging | Offen | Einheitliches Log-Format in Edge Functions |

---

## 10. Letzte 10 Commits

```
27790c6 feat: add Markenseite page type + improve Kategorieseite structure
6aba562 fix: rewrite system prompt - SEO expert + therapeutic credibility
ba47952 fix: system prompt writes as company, not as individual therapist
707115f feat: add Content Creator V2 - simplified K-Active brand voice tool
785f790 fix: robust content parsing for multiple AI response formats
5e7c9e3 fix: handle double-encoded JSON responses in content parsing
6c51191 fix: accept null for serpTermsStructured, increase timeout to 90s
1affca4 fix: set Gemini Flash as default model - Claude Sonnet times out
a659a6d fix: revert CORS to allow all origins - was blocking Lovable previews
3609bc8 feat: integrate DebugPanel logging into ContentCreator
```
