/**
 * Test-Script für alle Prompt-Versionen
 *
 * Verwendung:
 * 1. Starte die App: npm run dev
 * 2. Logge dich ein
 * 3. Öffne die Browser-Konsole
 * 4. Kopiere diesen Code und führe ihn aus
 *
 * Alternativ:
 * npx ts-node scripts/test-all-prompts.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://glwzxsqacxzhejytsvzl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsd3p4c3FhY3h6aGVqeXRzdnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjIwMjUsImV4cCI6MjA3ODE5ODAyNX0.czTSCOGL5d0FfBjMrn1zVN7flT0z-YABH_aPrgyKjSQ';

// Alle Prompt-Versionen
const PROMPT_VERSIONS = [
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
  'v9-master-prompt',
  'v10-geo-optimized'
];

// Standard Test-Daten
const TEST_DATA = {
  focusKeyword: 'Kinesiologie Tape',
  secondaryKeywords: ['Sporttape', 'Muskeltape', 'Physio Tape'],
  brandName: 'K-Active',
  mainTopic: 'Kinesiologie Tape für Sport und Therapie',
  targetAudience: 'end_customers',
  formOfAddress: 'du',
  tone: 'advisory',
  contentLength: 'medium',
  keywordDensity: 'normal',
  pageType: 'product',
  pageGoal: 'inform',
  includeFAQ: true,
  additionalInfo: 'Hochwertiges Tape aus Deutschland, OEKO-TEX zertifiziert',
};

interface TestResult {
  version: string;
  success: boolean;
  duration: number;
  wordCount: number;
  keywordCount: number;
  keywordDensity: string;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  hasFluffPhrases: boolean;
  fluffPhrasesFound: string[];
  faqCount: number;
  score: number;
  errors: string[];
  seoTextPreview: string;
}

// Verbotene Phrasen (Anti-Fluff)
const FLUFF_PHRASES = [
  'in der heutigen',
  'es ist wichtig',
  'zusammenfassend',
  'tauchen wir',
  'wie wir alle wissen',
  'heutzutage',
  'in diesem artikel',
  'herzlich willkommen',
  'generell kann man sagen',
  'ein entscheidender faktor',
];

async function testPromptVersion(
  supabase: any,
  session: any,
  version: string
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    version,
    success: false,
    duration: 0,
    wordCount: 0,
    keywordCount: 0,
    keywordDensity: '0%',
    h1Count: 0,
    h2Count: 0,
    h3Count: 0,
    hasFluffPhrases: false,
    fluffPhrasesFound: [],
    faqCount: 0,
    score: 0,
    errors: [],
    seoTextPreview: '',
  };

  try {
    console.log(`\n📝 Testing ${version}...`);

    const response = await supabase.functions.invoke('generate-seo-content', {
      body: {
        ...TEST_DATA,
        promptVersion: version,
      },
    });

    result.duration = Date.now() - startTime;

    if (response.error) {
      result.errors.push(response.error.message || 'Unknown error');
      return result;
    }

    const data = response.data;

    // Wenn Varianten zurückgegeben werden, nimm die erste
    const content = data.variants ? data.variants[0] : data;
    const seoText = content.seoText || '';

    // Wortanzahl
    const plainText = seoText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    result.wordCount = plainText.split(' ').filter((w: string) => w.length > 0).length;

    // Keyword-Zählung
    const keywordRegex = new RegExp(TEST_DATA.focusKeyword, 'gi');
    const matches = plainText.match(keywordRegex);
    result.keywordCount = matches ? matches.length : 0;
    result.keywordDensity = result.wordCount > 0
      ? ((result.keywordCount / result.wordCount) * 100).toFixed(2) + '%'
      : '0%';

    // Heading-Struktur
    result.h1Count = (seoText.match(/<h1[^>]*>/gi) || []).length;
    result.h2Count = (seoText.match(/<h2[^>]*>/gi) || []).length;
    result.h3Count = (seoText.match(/<h3[^>]*>/gi) || []).length;

    // Fluff-Phrasen prüfen
    const lowerText = plainText.toLowerCase();
    for (const phrase of FLUFF_PHRASES) {
      if (lowerText.includes(phrase)) {
        result.hasFluffPhrases = true;
        result.fluffPhrasesFound.push(phrase);
      }
    }

    // FAQ-Anzahl
    result.faqCount = content.faq ? content.faq.length : 0;

    // Preview (erste 200 Zeichen)
    result.seoTextPreview = plainText.substring(0, 200) + '...';

    // Score berechnen (0-100)
    let score = 0;

    // H1-Check (20 Punkte)
    if (result.h1Count === 1) score += 20;
    else if (result.h1Count > 1) score += 5; // Mehrere H1 = Abzug

    // Keyword im Text (15 Punkte)
    if (result.keywordCount >= 3 && result.keywordCount <= 15) score += 15;
    else if (result.keywordCount > 0) score += 8;

    // Wortanzahl (15 Punkte)
    if (result.wordCount >= 600 && result.wordCount <= 1200) score += 15;
    else if (result.wordCount >= 400) score += 10;
    else if (result.wordCount >= 200) score += 5;

    // H2-Struktur (15 Punkte)
    if (result.h2Count >= 3 && result.h2Count <= 8) score += 15;
    else if (result.h2Count >= 2) score += 10;

    // Keine Fluff-Phrasen (15 Punkte)
    if (!result.hasFluffPhrases) score += 15;
    else score += Math.max(0, 15 - result.fluffPhrasesFound.length * 3);

    // FAQ vorhanden (10 Punkte)
    if (result.faqCount >= 5) score += 10;
    else if (result.faqCount >= 3) score += 7;
    else if (result.faqCount > 0) score += 4;

    // Keyword-Dichte optimal (10 Punkte)
    const densityNum = parseFloat(result.keywordDensity);
    if (densityNum >= 0.5 && densityNum <= 2.0) score += 10;
    else if (densityNum > 0 && densityNum < 3.0) score += 5;

    result.score = score;
    result.success = true;

  } catch (error: any) {
    result.duration = Date.now() - startTime;
    result.errors.push(error.message || 'Unknown error');
  }

  return result;
}

async function runAllTests() {
  console.log('🚀 Starting Prompt Version Tests\n');
  console.log('='.repeat(60));

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Session prüfen
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (!session) {
    console.error('❌ Nicht eingeloggt! Bitte erst in der App einloggen.');
    console.log('\nAlternativ: Kopiere diesen Code in die Browser-Konsole, während du eingeloggt bist.');
    return;
  }

  console.log(`✅ Eingeloggt als: ${session.user.email}\n`);

  const results: TestResult[] = [];

  for (const version of PROMPT_VERSIONS) {
    const result = await testPromptVersion(supabase, session, version);
    results.push(result);

    if (result.success) {
      console.log(`✅ ${version}: Score ${result.score}/100 | ${result.wordCount} Wörter | ${result.duration}ms`);
    } else {
      console.log(`❌ ${version}: FEHLER - ${result.errors.join(', ')}`);
    }

    // Kurze Pause zwischen Requests
    await new Promise(r => setTimeout(r, 2000));
  }

  // Zusammenfassung
  console.log('\n' + '='.repeat(60));
  console.log('📊 ZUSAMMENFASSUNG\n');

  const sortedResults = [...results].sort((a, b) => b.score - a.score);

  console.log('🏆 TOP 5 VERSIONEN:');
  sortedResults.slice(0, 5).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.version}: ${r.score}/100`);
  });

  console.log('\n📈 DURCHSCHNITTSWERTE:');
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    const avgScore = successfulResults.reduce((sum, r) => sum + r.score, 0) / successfulResults.length;
    const avgWords = successfulResults.reduce((sum, r) => sum + r.wordCount, 0) / successfulResults.length;
    const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;

    console.log(`  Durchschn. Score: ${avgScore.toFixed(1)}/100`);
    console.log(`  Durchschn. Wörter: ${avgWords.toFixed(0)}`);
    console.log(`  Durchschn. Zeit: ${(avgDuration / 1000).toFixed(1)}s`);
  }

  console.log('\n⚠️ VERSIONEN MIT FLUFF-PHRASEN:');
  results.filter(r => r.hasFluffPhrases).forEach(r => {
    console.log(`  - ${r.version}: ${r.fluffPhrasesFound.join(', ')}`);
  });

  // Ergebnisse als JSON speichern
  console.log('\n📁 Ergebnisse werden gespeichert...');

  return results;
}

// Für Browser-Konsole exportieren
if (typeof window !== 'undefined') {
  (window as any).runPromptTests = runAllTests;
  console.log('💡 Führe runPromptTests() aus, um die Tests zu starten.');
}

// Für Node.js
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().then(results => {
    console.log('\n📝 Vollständige Ergebnisse:');
    console.log(JSON.stringify(results, null, 2));
  });
}

export { runAllTests, testPromptVersion, PROMPT_VERSIONS, TEST_DATA };
