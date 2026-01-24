/**
 * Browser Test Script für alle Prompt-Versionen
 *
 * VERWENDUNG:
 * 1. Öffne die App im Browser (npm run dev)
 * 2. Logge dich ein
 * 3. Öffne die Browser-Konsole (F12 → Console)
 * 4. Kopiere diesen GESAMTEN Code und füge ihn ein
 * 5. Drücke Enter
 * 6. Warte auf die Ergebnisse (ca. 5-10 Minuten)
 */

(async function runPromptTests() {
  console.log('🚀 PROMPT VERSION TESTER\n');
  console.log('='.repeat(60));

  // Supabase Client aus dem Fenster holen
  const SUPABASE_URL = 'https://glwzxsqacxzhejytsvzl.supabase.co';

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

  // Test-Daten
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
    additionalInfo: 'Hochwertiges Tape aus Deutschland, OEKO-TEX zertifiziert'
  };

  // Fluff-Phrasen
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
    'ein entscheidender faktor'
  ];

  // Session Token holen
  const supabaseKey = localStorage.getItem('sb-glwzxsqacxzhejytsvzl-auth-token');
  if (!supabaseKey) {
    console.error('❌ Nicht eingeloggt! Bitte erst in der App einloggen.');
    return;
  }

  const authData = JSON.parse(supabaseKey);
  const accessToken = authData.access_token;

  console.log(`✅ Eingeloggt\n`);
  console.log(`📝 Teste ${PROMPT_VERSIONS.length} Prompt-Versionen...\n`);

  const results = [];

  for (let i = 0; i < PROMPT_VERSIONS.length; i++) {
    const version = PROMPT_VERSIONS[i];
    console.log(`[${i + 1}/${PROMPT_VERSIONS.length}] Testing ${version}...`);

    const startTime = Date.now();

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-seo-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsd3p4c3FhY3h6aGVqeXRzdnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjIwMjUsImV4cCI6MjA3ODE5ODAyNX0.czTSCOGL5d0FfBjMrn1zVN7flT0z-YABH_aPrgyKjSQ'
        },
        body: JSON.stringify({
          ...TEST_DATA,
          promptVersion: version
        })
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        results.push({
          version,
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          duration
        });
        console.log(`   ❌ Fehler: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();

      // Content extrahieren
      const content = data.variants ? data.variants[0] : data;
      const seoText = content.seoText || '';

      // Analyse
      const plainText = seoText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const wordCount = plainText.split(' ').filter(w => w.length > 0).length;

      const keywordRegex = new RegExp(TEST_DATA.focusKeyword, 'gi');
      const keywordMatches = plainText.match(keywordRegex);
      const keywordCount = keywordMatches ? keywordMatches.length : 0;
      const keywordDensity = wordCount > 0 ? ((keywordCount / wordCount) * 100).toFixed(2) : '0';

      const h1Count = (seoText.match(/<h1[^>]*>/gi) || []).length;
      const h2Count = (seoText.match(/<h2[^>]*>/gi) || []).length;
      const h3Count = (seoText.match(/<h3[^>]*>/gi) || []).length;

      // Fluff prüfen
      const lowerText = plainText.toLowerCase();
      const fluffFound = FLUFF_PHRASES.filter(p => lowerText.includes(p));

      const faqCount = content.faq ? content.faq.length : 0;

      // Score berechnen
      let score = 0;
      if (h1Count === 1) score += 20;
      else if (h1Count > 1) score += 5;
      if (keywordCount >= 3 && keywordCount <= 15) score += 15;
      else if (keywordCount > 0) score += 8;
      if (wordCount >= 600 && wordCount <= 1200) score += 15;
      else if (wordCount >= 400) score += 10;
      else if (wordCount >= 200) score += 5;
      if (h2Count >= 3 && h2Count <= 8) score += 15;
      else if (h2Count >= 2) score += 10;
      if (fluffFound.length === 0) score += 15;
      else score += Math.max(0, 15 - fluffFound.length * 3);
      if (faqCount >= 5) score += 10;
      else if (faqCount >= 3) score += 7;
      else if (faqCount > 0) score += 4;
      const densityNum = parseFloat(keywordDensity);
      if (densityNum >= 0.5 && densityNum <= 2.0) score += 10;
      else if (densityNum > 0 && densityNum < 3.0) score += 5;

      const result = {
        version,
        success: true,
        duration,
        wordCount,
        keywordCount,
        keywordDensity: keywordDensity + '%',
        h1Count,
        h2Count,
        h3Count,
        fluffFound,
        faqCount,
        score,
        preview: plainText.substring(0, 150) + '...',
        fullContent: content
      };

      results.push(result);

      console.log(`   ✅ Score: ${score}/100 | ${wordCount} Wörter | ${(duration / 1000).toFixed(1)}s`);

    } catch (error) {
      results.push({
        version,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
      console.log(`   ❌ Fehler: ${error.message}`);
    }

    // Pause zwischen Requests
    await new Promise(r => setTimeout(r, 3000));
  }

  // ZUSAMMENFASSUNG
  console.log('\n' + '='.repeat(60));
  console.log('📊 ZUSAMMENFASSUNG\n');

  const successful = results.filter(r => r.success);
  const sortedByScore = [...successful].sort((a, b) => b.score - a.score);

  console.log('🏆 RANKING NACH SCORE:\n');
  console.table(sortedByScore.map((r, i) => ({
    'Rang': i + 1,
    'Version': r.version,
    'Score': r.score + '/100',
    'Wörter': r.wordCount,
    'Keywords': r.keywordCount,
    'Dichte': r.keywordDensity,
    'H1/H2/H3': `${r.h1Count}/${r.h2Count}/${r.h3Count}`,
    'FAQ': r.faqCount,
    'Fluff': r.fluffFound.length > 0 ? '⚠️' : '✅',
    'Zeit': (r.duration / 1000).toFixed(1) + 's'
  })));

  // Durchschnitte
  if (successful.length > 0) {
    const avgScore = (successful.reduce((s, r) => s + r.score, 0) / successful.length).toFixed(1);
    const avgWords = (successful.reduce((s, r) => s + r.wordCount, 0) / successful.length).toFixed(0);
    const avgTime = (successful.reduce((s, r) => s + r.duration, 0) / successful.length / 1000).toFixed(1);

    console.log('\n📈 DURCHSCHNITTE:');
    console.log(`   Score: ${avgScore}/100`);
    console.log(`   Wörter: ${avgWords}`);
    console.log(`   Zeit: ${avgTime}s`);
  }

  // Fluff-Warnungen
  const withFluff = successful.filter(r => r.fluffFound.length > 0);
  if (withFluff.length > 0) {
    console.log('\n⚠️ VERSIONEN MIT FLUFF-PHRASEN:');
    withFluff.forEach(r => {
      console.log(`   ${r.version}: "${r.fluffFound.join('", "')}"`);
    });
  }

  // Fehler
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('\n❌ FEHLGESCHLAGENE TESTS:');
    failed.forEach(r => {
      console.log(`   ${r.version}: ${r.error}`);
    });
  }

  // Ergebnisse global speichern
  window.promptTestResults = results;
  console.log('\n💾 Ergebnisse gespeichert in: window.promptTestResults');
  console.log('   Zugriff: promptTestResults[0].fullContent.seoText');

  // Download als JSON
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompt-test-results-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('\n📥 JSON-Datei wurde heruntergeladen.');

  return results;
})();
