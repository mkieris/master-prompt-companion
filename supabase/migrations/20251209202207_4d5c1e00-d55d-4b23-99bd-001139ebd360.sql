-- Insert v9 system prompt version
INSERT INTO public.system_prompt_versions (
  version_key,
  version_name,
  version_description,
  system_prompt,
  is_active,
  metadata
) VALUES (
  'v9-master',
  'v9 Master Prompt',
  'Komplett überarbeiteter Master-Prompt mit klarem Fokus auf natürliche Sprache, E-E-A-T, Anti-Patterns und strukturierte Qualitätskontrolle. Unterstützt Produkt- und Kategorieseiten mit zielgruppenspezifischen Anpassungen.',
  'MASTER SYSTEM-PROMPT v9.0 - Vollständige SEO-Content-Strategie mit E-E-A-T, Anti-Patterns, Compliance-Support und strukturierten Qualitätsprüfungen.',
  true,
  '{"focus": "comprehensive-seo", "complexity": "master", "features": ["anti-patterns", "eeat", "compliance", "multimediale-gestaltung", "zielgruppen-spezifisch", "keyword-strategie-2025"]}'::jsonb
)
ON CONFLICT (version_key) DO UPDATE SET
  version_name = EXCLUDED.version_name,
  version_description = EXCLUDED.version_description,
  system_prompt = EXCLUDED.system_prompt,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = now();