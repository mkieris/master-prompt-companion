# Master Prompt Companion - Projektkontext

## Projektübersicht
**Ziel**: Das beste Content AI Tool für K-Active (Healthcare/Medtech) bauen.
**Benchmark**: Surfer SEO-Level erreichen mit Live-Scoring und SERP-Integration.

## Technologie-Stack
- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Markdown**: react-markdown für Content Preview
- **Backend**: Supabase (Auth, DB, Edge Functions)
- **AI**: Gemini Flash/Pro, Claude Sonnet

## Architektur des Content Creators

### 3-Panel Layout (Surfer SEO-Style)
1. **Links - ConfigPanel**: Keyword, Einstellungen, SERP-Daten
2. **Mitte - ContentEditor**: Preview, Meta, HTML, Refine-Tabs
3. **Rechts - ContentScorePanel**: Live Score 0-100, SERP Terms Checklist

### Wichtige Dateien
- `src/pages/ContentCreator.tsx` - Hauptseite mit State Management
- `src/components/content-creator/ConfigPanel.tsx` - Konfiguration
- `src/components/content-creator/ContentEditor.tsx` - Editor
- `src/components/content-creator/ContentScorePanel.tsx` - Live Score

### Datenfluss
1. User gibt Keyword ein
2. Auto SERP-Analyse (debounced 1500ms)
3. Domain Knowledge wird geladen
4. User klickt "Generieren"
5. Edge Function `generate-seo-content` wird aufgerufen
6. Live Score aktualisiert sich mit Content

## Supabase Edge Functions
- `generate-seo-content` - Content-Generierung mit AI
- `analyze-serp` - SERP-Analyse via Serper.dev
- `scrape-website` - Website-Crawling via Firecrawl
- `analyze-competitor` - Wettbewerber-Analyse

## Bereits implementiert
- [x] Unified Content Creator (Basic + Pro zusammengeführt)
- [x] 3-Panel Surfer SEO Layout
- [x] Live Content Score (0-100)
- [x] Auto SERP-Analyse auf Keyword-Eingabe
- [x] Domain Knowledge Integration
- [x] SERP Terms Checklist (mustHave, shouldHave, niceToHave)
- [x] Generation Analytics Dashboard (`/dashboard/analytics`)
- [x] Markdown Preview mit react-markdown (HTML + Markdown Support)
- [x] Outline Mode in Edge Function (generate-outline)

## Neue Dateien (2026-03-11)
- `src/pages/GenerationAnalytics.tsx` - Analytics Dashboard
  - Prompt Version Performance (30 Tage)
  - Tägliche Statistiken
  - Letzte Generierungen

## Entfernte Features
- Varianten A/B/C (entfernt am 2026-03-11) - User Feedback: unklar ob funktioniert
- Tote UI-Felder aus ContentConfig entfernt (2026-03-11):
  - targetAudience, contentType, additionalKeywords, tone, perspective, emphasis

## Bekannte Gaps / TODO
- [ ] Outline Mode UI im ConfigPanel integrieren
- [ ] SERP-Daten besser in Prompt integrieren
- [ ] Competitor Content als Kontext nutzen
- [ ] Unit Tests für Content Score Berechnung
- [ ] E2E Tests für Generation Flow
- [ ] Structured Logging implementieren

## K-Active Spezifika
- **Branche**: Healthcare/Medtech
- **Compliance**: MDR, HWG (Heilmittelwerbegesetz)
- **Zielgruppe**: B2B + B2C
- **Wichtig**: Medizinische Claims müssen belegt sein

## Code-Konventionen
- TypeScript strict mode
- Deutsche UI-Texte
- shadcn/ui Komponenten nutzen
- Hooks für wiederverwendbare Logik

## Git Workflow
- Feature Branches: `claude/*`
- Commits: Konventionelle Commit Messages
- Vor Push: `npm run build` muss erfolgreich sein
