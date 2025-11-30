import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Users,
  Shield,
  FileText,
  Search,
  Zap,
  Award,
  Loader2,
  Copy,
  Download,
  Check,
  FileDown,
  Send,
  MessageSquare
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from "docx";
import { saveAs } from "file-saver";

interface GeneratedContent {
  seoText: string;
  faq?: { question: string; answer: string }[];
  title?: string;
  metaDescription?: string;
  internalLinks?: { url: string; anchorText: string }[];
  technicalHints?: string;
  qualityReport?: {
    status: string;
    flags: any[];
    evidenceTable?: any[];
  };
}

interface Step5Props {
  generatedContent: GeneratedContent | null;
  formData: {
    focusKeyword: string;
    secondaryKeywords: string[];
    pageType: string;
    targetAudience: string;
    wordCount: string;
  };
  onBack: () => void;
  onFinish: () => void;
  onRegenerate: () => void;
  onRefine?: (prompt: string) => Promise<void>;
  isRegenerating?: boolean;
  isRefining?: boolean;
}

interface CheckResult {
  id: string;
  category: string;
  name: string;
  status: 'pass' | 'warning' | 'fail' | 'info';
  message: string;
  details?: string;
  source?: string;
}

// SEO Analysis Functions
function countWords(text: string): number {
  return text.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;
}

function countOccurrences(text: string, keyword: string): number {
  const cleanText = text.replace(/<[^>]*>/g, '').toLowerCase();
  const keywordLower = keyword.toLowerCase();
  const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
  return (cleanText.match(regex) || []).length;
}

function extractHeadings(html: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  const regex = /<h([1-6])[^>]*>([^<]*)<\/h[1-6]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({ level: parseInt(match[1]), text: match[2].trim() });
  }
  return headings;
}

function getFirst100Words(html: string): string {
  const text = html.replace(/<[^>]*>/g, '');
  return text.split(/\s+/).slice(0, 100).join(' ');
}

function countSentences(text: string): number {
  const cleanText = text.replace(/<[^>]*>/g, '');
  return (cleanText.match(/[.!?]+/g) || []).length;
}

function calculateAvgSentenceLength(text: string): number {
  const words = countWords(text);
  const sentences = countSentences(text);
  return sentences > 0 ? Math.round(words / sentences) : 0;
}

function countPassiveVoice(text: string): number {
  const cleanText = text.replace(/<[^>]*>/g, '').toLowerCase();
  const passiveIndicators = ['wird', 'werden', 'wurde', 'wurden', 'worden', 'geworden', 'werde', 'wirst', 'werdet'];
  let count = 0;
  passiveIndicators.forEach(indicator => {
    const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
    count += (cleanText.match(regex) || []).length;
  });
  return count;
}

function analyzeContent(content: GeneratedContent, formData: Step5Props['formData']): CheckResult[] {
  const checks: CheckResult[] = [];
  const seoText = content.seoText || '';
  const wordCount = countWords(seoText);
  const headings = extractHeadings(seoText);
  const h1s = headings.filter(h => h.level === 1);
  const first100Words = getFirst100Words(seoText);
  
  // ==========================================
  // E-E-A-T CHECKS (Google Quality Guidelines)
  // ==========================================
  
  // Experience Check
  const hasExperienceIndicators = /erfahrung|praxis|getestet|erprobt|bewährt|alltag|anwendung/i.test(seoText);
  checks.push({
    id: 'eeat-experience',
    category: 'E-E-A-T',
    name: 'Experience (Erfahrung)',
    status: hasExperienceIndicators ? 'pass' : 'warning',
    message: hasExperienceIndicators 
      ? 'Text enthält Erfahrungsindikatoren'
      : 'Text könnte mehr praktische Erfahrungsbeispiele enthalten',
    details: 'Google bewertet Content höher, der echte Praxiserfahrung zeigt. Nutze konkrete Anwendungsbeispiele, Fallstudien oder Erfahrungsberichte.',
    source: 'Google E-E-A-T Guidelines 2024'
  });

  // Expertise Check
  const hasExpertiseIndicators = /experte|fachmann|spezialist|studien|forschung|wissenschaft|zertifiziert|qualifiziert/i.test(seoText);
  const hasCredentials = /dr\.|prof\.|dipl\.|zertifiziert|ausgebildet/i.test(seoText);
  checks.push({
    id: 'eeat-expertise',
    category: 'E-E-A-T',
    name: 'Expertise (Fachwissen)',
    status: hasExpertiseIndicators || hasCredentials ? 'pass' : 'warning',
    message: hasExpertiseIndicators 
      ? 'Fachwissen wird im Text kommuniziert'
      : 'Mehr Expertise-Signale würden Vertrauen stärken',
    details: 'Zeige Fachkompetenz durch: Quellenangaben, Expertenaussagen, technische Details, Zertifizierungen.',
    source: 'John Mueller, Google Search Central'
  });

  // Authoritativeness Check
  const hasAuthoritySignals = /führend|marktführer|bekannt für|renommiert|ausgezeichnet|award/i.test(seoText);
  checks.push({
    id: 'eeat-authority',
    category: 'E-E-A-T',
    name: 'Authoritativeness (Autorität)',
    status: hasAuthoritySignals ? 'pass' : 'info',
    message: hasAuthoritySignals 
      ? 'Autoritätssignale vorhanden'
      : 'Autoritätssignale können die Glaubwürdigkeit stärken',
    details: 'Autorität entsteht durch: Branchenbekanntheit, Awards, Medienerwähnungen, Expertenempfehlungen. Vermeide aber übertriebene Selbstdarstellung.',
    source: 'Google Quality Rater Guidelines'
  });

  // Trustworthiness Check
  const hasTrustSignals = /transparent|sicher|geprüft|zertifiziert|garantie|datenschutz|qualität/i.test(seoText);
  checks.push({
    id: 'eeat-trust',
    category: 'E-E-A-T',
    name: 'Trustworthiness (Vertrauenswürdigkeit)',
    status: hasTrustSignals ? 'pass' : 'warning',
    message: hasTrustSignals 
      ? 'Vertrauenssignale im Text vorhanden'
      : 'Mehr Vertrauenssignale würden die Conversion verbessern',
    details: 'Trust-Signale: Zertifikate, Garantien, transparente Informationen, Kontaktdaten, Bewertungen.',
    source: 'Google E-E-A-T Framework'
  });

  // ==========================================
  // HELPFUL CONTENT CHECKS (John Mueller)
  // ==========================================

  // People-First Content
  const hasUserFocus = /sie |du |ihr |dein |nutzen|vorteil|lösung|hilft|unterstützt/i.test(seoText);
  checks.push({
    id: 'helpful-people-first',
    category: 'Helpful Content',
    name: 'People-First Content',
    status: hasUserFocus ? 'pass' : 'fail',
    message: hasUserFocus 
      ? 'Text ist nutzerorientiert geschrieben'
      : 'Text sollte stärker auf den Nutzer fokussiert sein',
    details: 'John Mueller: "Schreibe für Menschen, nicht für Suchmaschinen." Stelle den Nutzen für den Leser in den Vordergrund, nicht Keywords.',
    source: 'John Mueller, Google Search Advocate'
  });

  // Unique Value Check
  const wordCountCheck = wordCount >= 300;
  const hasUniqueValue = /besonders|einzigartig|exklusiv|neu|innovativ|unterschied/i.test(seoText);
  checks.push({
    id: 'helpful-unique-value',
    category: 'Helpful Content',
    name: 'Unique Value (Mehrwert)',
    status: hasUniqueValue && wordCountCheck ? 'pass' : 'warning',
    message: hasUniqueValue 
      ? 'Text bietet erkennbaren Mehrwert'
      : 'Differenzierung vom Wettbewerb könnte stärker sein',
    details: 'Google: "Bietet der Content substanzielle Informationen, die über das hinausgehen, was bereits verfügbar ist?"',
    source: 'Google Helpful Content Update 2024'
  });

  // Content Depth vs. Fluff
  const avgSentenceLength = calculateAvgSentenceLength(seoText);
  const passiveCount = countPassiveVoice(seoText);
  const passiveRatio = (passiveCount / countSentences(seoText)) * 100;
  
  checks.push({
    id: 'helpful-no-fluff',
    category: 'Helpful Content',
    name: 'Kein Content-Füller',
    status: passiveRatio < 20 && avgSentenceLength < 25 ? 'pass' : 'warning',
    message: passiveRatio < 20 
      ? 'Text ist prägnant und aktiv formuliert'
      : `${Math.round(passiveRatio)}% Passiv-Konstruktionen gefunden`,
    details: 'Evergreen Media: "Vermeide Fülltext und Passiv-Konstruktionen. Jeder Satz sollte Mehrwert bieten."',
    source: 'Evergreen Media SEO Best Practices'
  });

  // ==========================================
  // KEYWORD OPTIMIZATION
  // ==========================================

  // Keyword in H1
  const keywordInH1 = h1s.some(h => h.text.toLowerCase().includes(formData.focusKeyword.toLowerCase()));
  checks.push({
    id: 'keyword-h1',
    category: 'Keyword-Optimierung',
    name: 'Fokus-Keyword in H1',
    status: keywordInH1 ? 'pass' : 'fail',
    message: keywordInH1 
      ? `"${formData.focusKeyword}" ist in der H1 enthalten`
      : `"${formData.focusKeyword}" fehlt in der H1-Überschrift`,
    details: 'Das Fokus-Keyword sollte möglichst am Anfang der H1 stehen für maximale SEO-Wirkung.',
    source: 'Google SEO Starter Guide'
  });

  // Keyword in First 100 Words
  const keywordInFirst100 = first100Words.toLowerCase().includes(formData.focusKeyword.toLowerCase());
  checks.push({
    id: 'keyword-first100',
    category: 'Keyword-Optimierung',
    name: 'Keyword in ersten 100 Wörtern',
    status: keywordInFirst100 ? 'pass' : 'fail',
    message: keywordInFirst100 
      ? 'Fokus-Keyword erscheint früh im Text'
      : 'Fokus-Keyword sollte in den ersten 100 Wörtern vorkommen',
    details: 'Google gewichtet Keywords am Textanfang stärker. Platziere das Hauptkeyword natürlich in der Einleitung.',
    source: 'SEO Best Practice'
  });

  // Keyword Density
  const keywordCount = countOccurrences(seoText, formData.focusKeyword);
  const keywordDensity = (keywordCount / wordCount) * 100;
  checks.push({
    id: 'keyword-density',
    category: 'Keyword-Optimierung',
    name: 'Keyword-Dichte',
    status: keywordDensity >= 1 && keywordDensity <= 3 ? 'pass' : keywordDensity < 1 ? 'warning' : 'fail',
    message: `Keyword-Dichte: ${keywordDensity.toFixed(1)}% (${keywordCount}x in ${wordCount} Wörtern)`,
    details: keywordDensity > 3 
      ? 'John Mueller: "Es gibt keine ideale Keyword-Dichte. Schreibe natürlich." Über 3% wirkt unnatürlich.'
      : 'Empfohlen: 1-3% Keyword-Dichte für natürliche Integration.',
    source: 'John Mueller, LinkedIn 2024'
  });

  // Secondary Keywords
  const secondaryKeywordsUsed = formData.secondaryKeywords.filter(kw => 
    seoText.toLowerCase().includes(kw.toLowerCase())
  ).length;
  const secondaryRatio = formData.secondaryKeywords.length > 0 
    ? (secondaryKeywordsUsed / formData.secondaryKeywords.length) * 100 
    : 100;
  checks.push({
    id: 'keyword-secondary',
    category: 'Keyword-Optimierung',
    name: 'Sekundäre Keywords',
    status: secondaryRatio >= 70 ? 'pass' : secondaryRatio >= 50 ? 'warning' : 'fail',
    message: `${secondaryKeywordsUsed}/${formData.secondaryKeywords.length} sekundäre Keywords verwendet`,
    details: 'Sekundäre Keywords und Synonyme helfen Google, den thematischen Kontext besser zu verstehen.',
    source: 'Semantic SEO'
  });

  // ==========================================
  // CONTENT STRUCTURE
  // ==========================================

  // Single H1
  checks.push({
    id: 'structure-h1-single',
    category: 'Content-Struktur',
    name: 'Einzelne H1-Überschrift',
    status: h1s.length === 1 ? 'pass' : 'fail',
    message: h1s.length === 1 
      ? 'Genau eine H1-Überschrift vorhanden'
      : `${h1s.length} H1-Überschriften gefunden (sollte nur 1 sein)`,
    details: 'Google empfiehlt eine einzige H1 pro Seite, die das Hauptthema klar kommuniziert.',
    source: 'Google Search Central Documentation'
  });

  // Heading Hierarchy
  const hasProperHierarchy = headings.every((h, i, arr) => {
    if (i === 0) return true;
    return h.level <= arr[i-1].level + 1;
  });
  checks.push({
    id: 'structure-hierarchy',
    category: 'Content-Struktur',
    name: 'Überschriften-Hierarchie',
    status: hasProperHierarchy ? 'pass' : 'warning',
    message: hasProperHierarchy 
      ? 'Logische Überschriften-Hierarchie (H1→H2→H3)'
      : 'Überschriften-Hierarchie hat Sprünge (z.B. H1→H3)',
    details: 'Eine saubere Hierarchie hilft Suchmaschinen und Screenreadern, den Content zu verstehen.',
    source: 'Web Accessibility Guidelines'
  });

  // Word Count
  const targetWordCount = parseInt(formData.wordCount) || 800;
  const wordCountDiff = Math.abs(wordCount - targetWordCount);
  const wordCountPercent = (wordCountDiff / targetWordCount) * 100;
  checks.push({
    id: 'structure-wordcount',
    category: 'Content-Struktur',
    name: 'Wortanzahl',
    status: wordCountPercent <= 20 ? 'pass' : wordCountPercent <= 40 ? 'warning' : 'fail',
    message: `${wordCount} Wörter (Ziel: ~${targetWordCount})`,
    details: 'John Mueller: "Es gibt keine magische Wortanzahl. Die richtige Länge ist die, die das Thema vollständig abdeckt."',
    source: 'John Mueller, Google Search Central'
  });

  // FAQ Present
  const hasFAQ = content.faq && content.faq.length >= 3;
  checks.push({
    id: 'structure-faq',
    category: 'Content-Struktur',
    name: 'FAQ-Bereich',
    status: hasFAQ ? 'pass' : 'info',
    message: hasFAQ 
      ? `${content.faq?.length} FAQs vorhanden`
      : 'Kein oder zu wenig FAQs',
    details: 'FAQs können für Featured Snippets und Voice Search optimiert werden. Schema.org FAQPage Markup empfohlen.',
    source: 'Google Rich Results'
  });

  // ==========================================
  // META & TECHNICAL
  // ==========================================

  // Title Tag Length
  const titleLength = content.title?.length || 0;
  checks.push({
    id: 'meta-title',
    category: 'Meta & Technical',
    name: 'Title Tag',
    status: titleLength >= 30 && titleLength <= 60 ? 'pass' : 'warning',
    message: `Title: ${titleLength} Zeichen ${titleLength > 60 ? '(zu lang)' : titleLength < 30 ? '(zu kurz)' : '(optimal)'}`,
    details: 'Optimale Title-Länge: 50-60 Zeichen. Google schneidet längere Titles ab.',
    source: 'Google Search Central'
  });

  // Meta Description Length
  const metaLength = content.metaDescription?.length || 0;
  checks.push({
    id: 'meta-description',
    category: 'Meta & Technical',
    name: 'Meta Description',
    status: metaLength >= 120 && metaLength <= 155 ? 'pass' : 'warning',
    message: `Meta Description: ${metaLength} Zeichen ${metaLength > 155 ? '(zu lang)' : metaLength < 120 ? '(zu kurz)' : '(optimal)'}`,
    details: 'Optimale Länge: 150-155 Zeichen. Die Description sollte zum Klicken animieren.',
    source: 'Google Search Central'
  });

  // Internal Links
  const hasInternalLinks = content.internalLinks && content.internalLinks.length > 0;
  checks.push({
    id: 'meta-internal-links',
    category: 'Meta & Technical',
    name: 'Interne Verlinkung',
    status: hasInternalLinks ? 'pass' : 'warning',
    message: hasInternalLinks 
      ? `${content.internalLinks?.length} interne Links vorgeschlagen`
      : 'Keine internen Links vorgeschlagen',
    details: 'Evergreen Media: "Interne Links verteilen PageRank und helfen Google, Seitenstrukturen zu verstehen."',
    source: 'Evergreen Media'
  });

  // ==========================================
  // READABILITY (Evergreen Media)
  // ==========================================

  // Sentence Length
  checks.push({
    id: 'readability-sentences',
    category: 'Lesbarkeit',
    name: 'Durchschnittliche Satzlänge',
    status: avgSentenceLength <= 20 ? 'pass' : avgSentenceLength <= 25 ? 'warning' : 'fail',
    message: `Ø ${avgSentenceLength} Wörter pro Satz`,
    details: avgSentenceLength > 20 
      ? 'Evergreen Media empfiehlt max. 15-20 Wörter pro Satz für bessere Lesbarkeit.'
      : 'Gute Satzlänge für Online-Content.',
    source: 'Evergreen Media Readability Guidelines'
  });

  // Active Voice
  checks.push({
    id: 'readability-passive',
    category: 'Lesbarkeit',
    name: 'Aktive Sprache',
    status: passiveRatio < 15 ? 'pass' : passiveRatio < 25 ? 'warning' : 'fail',
    message: `${Math.round(passiveRatio)}% Passiv-Konstruktionen`,
    details: 'Aktive Formulierungen wirken direkter und überzeugender. Ziel: unter 15% Passiv.',
    source: 'Content Marketing Best Practice'
  });

  return checks;
}

export const Step5AfterCheck = ({ 
  generatedContent, 
  formData, 
  onBack, 
  onFinish,
  onRegenerate,
  onRefine,
  isRegenerating,
  isRefining 
}: Step5Props) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['E-E-A-T', 'Keyword-Optimierung']);
  const [copied, setCopied] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const { toast } = useToast();

  const handleRefine = async () => {
    if (!refinementPrompt.trim() || !onRefine) return;
    await onRefine(refinementPrompt);
    setRefinementPrompt("");
  };

  const checks = useMemo(() => {
    if (!generatedContent) return [];
    return analyzeContent(generatedContent, formData);
  }, [generatedContent, formData]);

  const categories = useMemo(() => {
    const cats: Record<string, CheckResult[]> = {};
    checks.forEach(check => {
      if (!cats[check.category]) cats[check.category] = [];
      cats[check.category].push(check);
    });
    return cats;
  }, [checks]);

  const stats = useMemo(() => {
    const passed = checks.filter(c => c.status === 'pass').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    const failed = checks.filter(c => c.status === 'fail').length;
    const info = checks.filter(c => c.status === 'info').length;
    const total = checks.length;
    const score = Math.round(((passed + (warnings * 0.5) + (info * 0.7)) / total) * 100);
    return { passed, warnings, failed, info, total, score };
  }, [checks]);

  // Convert HTML to plain text
  const htmlToPlainText = (html: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  // Generate copy content
  const generateCopyContent = (): string => {
    if (!generatedContent) return '';
    
    let content = '';
    
    // Title & Meta
    content += `TITLE:\n${generatedContent.title || ''}\n\n`;
    content += `META DESCRIPTION:\n${generatedContent.metaDescription || ''}\n\n`;
    
    // Main SEO Text
    content += `SEO-TEXT:\n${htmlToPlainText(generatedContent.seoText || '')}\n\n`;
    
    // FAQ
    if (generatedContent.faq && generatedContent.faq.length > 0) {
      content += `FAQ:\n`;
      generatedContent.faq.forEach((item: any, i: number) => {
        if (item?.question && item?.answer) {
          content += `${i + 1}. ${item.question}\n${item.answer}\n\n`;
        }
      });
    }
    
    // Internal Links
    if (generatedContent.internalLinks && generatedContent.internalLinks.length > 0) {
      content += `\nINTERNE LINKS:\n`;
      generatedContent.internalLinks.forEach((link: any) => {
        if (link?.anchorText && link?.url) {
          content += `- ${link.anchorText}: ${link.url}\n`;
        }
      });
    }
    
    // Technical Hints
    if (generatedContent.technicalHints) {
      content += `\nTECHNISCHE HINWEISE:\n`;
      content += typeof generatedContent.technicalHints === 'string' 
        ? generatedContent.technicalHints 
        : JSON.stringify(generatedContent.technicalHints, null, 2);
    }
    
    return content;
  };

  // Copy to clipboard
  const handleCopy = async () => {
    const content = generateCopyContent();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({
        title: "Kopiert!",
        description: "Der SEO-Content wurde in die Zwischenablage kopiert.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Konnte nicht in die Zwischenablage kopieren.",
        variant: "destructive",
      });
    }
  };

  // Export as PDF
  const handleExportPDF = () => {
    if (!generatedContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Popup blockiert",
        description: "Bitte erlauben Sie Popups für den PDF-Export.",
        variant: "destructive",
      });
      return;
    }

    const faqHtml = generatedContent.faq && Array.isArray(generatedContent.faq)
      ? generatedContent.faq.map((item: any, i: number) => 
          item?.question && item?.answer 
            ? `<div style="margin-bottom: 16px;"><strong>${i + 1}. ${item.question}</strong><p style="margin: 8px 0 0 0; color: #555;">${item.answer}</p></div>` 
            : ''
        ).join('')
      : '';

    const linksHtml = generatedContent.internalLinks && Array.isArray(generatedContent.internalLinks)
      ? generatedContent.internalLinks.map((link: any) => 
          link?.anchorText && link?.url 
            ? `<li><strong>${link.anchorText}</strong>: ${link.url}</li>` 
            : ''
        ).join('')
      : '';

    const technicalHints = typeof generatedContent.technicalHints === 'string'
      ? generatedContent.technicalHints
      : JSON.stringify(generatedContent.technicalHints, null, 2);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>SEO Content Export - ${formData.focusKeyword}</title>
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
          }
          h1 { color: #1a1a2e; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; }
          h2 { color: #4f46e5; margin-top: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
          h3 { color: #374151; }
          .meta-box { 
            background: #f3f4f6; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #4f46e5;
          }
          .meta-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-value { font-size: 16px; margin-top: 4px; }
          .seo-text { background: #fafafa; padding: 24px; border-radius: 8px; margin: 20px 0; }
          .score-badge { 
            display: inline-block;
            background: #10b981; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-weight: bold;
            font-size: 14px;
          }
          .header-info { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 24px;
          }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            font-size: 12px; 
            color: #9ca3af;
            text-align: center;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header-info">
          <h1>SEO Content Export</h1>
          <span class="score-badge">Score: ${stats.score}%</span>
        </div>
        
        <p><strong>Fokus-Keyword:</strong> ${formData.focusKeyword}</p>
        <p><strong>Seitentyp:</strong> ${formData.pageType === 'product' ? 'Produktseite' : formData.pageType === 'category' ? 'Kategorieseite' : 'Ratgeber/Blog'}</p>
        <p><strong>Exportiert am:</strong> ${new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        
        <h2>📝 Title & Meta Description</h2>
        <div class="meta-box">
          <div class="meta-label">Title Tag (${(generatedContent.title || '').length} Zeichen)</div>
          <div class="meta-value">${generatedContent.title || ''}</div>
        </div>
        <div class="meta-box">
          <div class="meta-label">Meta Description (${(generatedContent.metaDescription || '').length} Zeichen)</div>
          <div class="meta-value">${generatedContent.metaDescription || ''}</div>
        </div>
        
        <h2>📄 SEO-Text</h2>
        <div class="seo-text">
          ${generatedContent.seoText || ''}
        </div>
        
        ${faqHtml ? `
        <h2>❓ FAQ</h2>
        ${faqHtml}
        ` : ''}
        
        ${linksHtml ? `
        <h2>🔗 Interne Verlinkung</h2>
        <ul>${linksHtml}</ul>
        ` : ''}
        
        ${technicalHints ? `
        <h2>⚙️ Technische Hinweise</h2>
        <pre style="background: #f3f4f6; padding: 16px; border-radius: 8px; white-space: pre-wrap; font-size: 13px;">${technicalHints}</pre>
        ` : ''}
        
        <div class="footer">
          Erstellt mit SEO Content Generator Pro
        </div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    toast({
      title: "PDF-Export",
      description: "Das Druckfenster wurde geöffnet. Wählen Sie 'Als PDF speichern'.",
    });
  };

  // Export as DOCX
  const handleExportDOCX = async () => {
    if (!generatedContent) return;

    try {
      const pageTypeLabel = formData.pageType === 'product' 
        ? 'Produktseite' 
        : formData.pageType === 'category' 
          ? 'Kategorieseite' 
          : 'Ratgeber/Blog';

      const sections: Paragraph[] = [];

      // Title
      sections.push(
        new Paragraph({
          text: "SEO Content Export",
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 },
        })
      );

      // Meta info
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "SEO-Qualitätsscore: ", bold: true }),
            new TextRun({ text: `${stats.score}%`, bold: true, color: stats.score >= 70 ? "00AA00" : stats.score >= 50 ? "FFAA00" : "FF0000" }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Fokus-Keyword: ", bold: true }),
            new TextRun({ text: formData.focusKeyword }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Seitentyp: ", bold: true }),
            new TextRun({ text: pageTypeLabel }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Exportiert am: ", bold: true }),
            new TextRun({ text: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }),
          ],
          spacing: { after: 400 },
        })
      );

      // Title Tag Section
      sections.push(
        new Paragraph({
          text: "Title Tag",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: generatedContent.title || '' }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `(${(generatedContent.title || '').length} Zeichen)`, italics: true, size: 20, color: "666666" }),
          ],
          spacing: { after: 300 },
        })
      );

      // Meta Description Section
      sections.push(
        new Paragraph({
          text: "Meta Description",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: generatedContent.metaDescription || '' }),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `(${(generatedContent.metaDescription || '').length} Zeichen)`, italics: true, size: 20, color: "666666" }),
          ],
          spacing: { after: 300 },
        })
      );

      // SEO Text Section
      sections.push(
        new Paragraph({
          text: "SEO-Text",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );

      // Parse HTML content to plain text paragraphs
      const plainText = htmlToPlainText(generatedContent.seoText || '');
      const textParagraphs = plainText.split('\n').filter(p => p.trim());
      textParagraphs.forEach(text => {
        sections.push(
          new Paragraph({
            text: text.trim(),
            spacing: { after: 200 },
          })
        );
      });

      // FAQ Section
      if (generatedContent.faq && generatedContent.faq.length > 0) {
        sections.push(
          new Paragraph({
            text: "FAQ",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );

        generatedContent.faq.forEach((item: any, index: number) => {
          if (item?.question && item?.answer) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${index + 1}. ${item.question}`, bold: true }),
                ],
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: item.answer,
                spacing: { after: 200 },
              })
            );
          }
        });
      }

      // Internal Links Section
      if (generatedContent.internalLinks && generatedContent.internalLinks.length > 0) {
        sections.push(
          new Paragraph({
            text: "Interne Verlinkung",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );

        generatedContent.internalLinks.forEach((link: any) => {
          if (link?.anchorText && link?.url) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `• ${link.anchorText}: `, bold: true }),
                  new TextRun({ text: link.url, color: "0066CC" }),
                ],
                spacing: { after: 100 },
              })
            );
          }
        });
      }

      // Technical Hints
      if (generatedContent.technicalHints) {
        sections.push(
          new Paragraph({
            text: "Technische Hinweise",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: typeof generatedContent.technicalHints === 'string' 
              ? generatedContent.technicalHints 
              : JSON.stringify(generatedContent.technicalHints, null, 2),
            spacing: { after: 200 },
          })
        );
      }

      // Footer
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Erstellt mit SEO Content Generator Pro", italics: true, size: 20, color: "999999" }),
          ],
          spacing: { before: 600 },
          alignment: AlignmentType.CENTER,
        })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children: sections,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const filename = `seo-content-${formData.focusKeyword.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.docx`;
      saveAs(blob, filename);

      toast({
        title: "Word-Export erfolgreich",
        description: `Die Datei "${filename}" wurde heruntergeladen.`,
      });
    } catch (error) {
      console.error('DOCX export error:', error);
      toast({
        title: "Export-Fehler",
        description: "Der Word-Export ist fehlgeschlagen. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'E-E-A-T': return <Shield className="h-4 w-4" />;
      case 'Helpful Content': return <Users className="h-4 w-4" />;
      case 'Keyword-Optimierung': return <Target className="h-4 w-4" />;
      case 'Content-Struktur': return <FileText className="h-4 w-4" />;
      case 'Meta & Technical': return <Search className="h-4 w-4" />;
      case 'Lesbarkeit': return <Zap className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exzellent';
    if (score >= 80) return 'Sehr gut';
    if (score >= 70) return 'Gut';
    if (score >= 60) return 'Befriedigend';
    if (score >= 50) return 'Ausbaufähig';
    return 'Überarbeitung empfohlen';
  };

  if (!generatedContent) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Kein generierter Content vorhanden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Schritt 5: SEO After-Check
        </h2>
        <p className="text-sm text-muted-foreground">
          Prüfung basierend auf Google E-E-A-T, John Mueller Guidelines & Evergreen Media Best Practices
        </p>
      </div>

      {/* Score Overview */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">SEO-Qualitätsscore</h3>
              <p className="text-sm text-muted-foreground">{getScoreLabel(stats.score)}</p>
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(stats.score)}`}>
              {stats.score}%
            </div>
          </div>
          <Progress value={stats.score} className="h-3 mb-4" />
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div className="p-2 bg-green-500/10 rounded">
              <div className="font-bold text-green-600">{stats.passed}</div>
              <div className="text-muted-foreground">Bestanden</div>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded">
              <div className="font-bold text-yellow-600">{stats.warnings}</div>
              <div className="text-muted-foreground">Hinweise</div>
            </div>
            <div className="p-2 bg-red-500/10 rounded">
              <div className="font-bold text-red-600">{stats.failed}</div>
              <div className="text-muted-foreground">Probleme</div>
            </div>
            <div className="p-2 bg-blue-500/10 rounded">
              <div className="font-bold text-blue-600">{stats.info}</div>
              <div className="text-muted-foreground">Info</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Checks */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {Object.entries(categories).map(([category, categoryChecks]) => {
            const categoryPassed = categoryChecks.filter(c => c.status === 'pass').length;
            const categoryTotal = categoryChecks.length;
            const isExpanded = expandedCategories.includes(category);

            return (
              <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {getCategoryIcon(category)}
                          </div>
                          <div className="text-left">
                            <CardTitle className="text-sm font-medium">{category}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {categoryPassed}/{categoryTotal} Checks bestanden
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={categoryPassed === categoryTotal ? 'default' : 'secondary'}>
                            {Math.round((categoryPassed / categoryTotal) * 100)}%
                          </Badge>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="space-y-3 border-t pt-4">
                        {categoryChecks.map(check => (
                          <div key={check.id} className="p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-start gap-3">
                              {getStatusIcon(check.status)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{check.name}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{check.message}</p>
                                {check.details && (
                                  <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-primary/30 pl-2">
                                    {check.details}
                                  </p>
                                )}
                                {check.source && (
                                  <p className="text-xs text-primary/70 mt-1">
                                    📚 {check.source}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Text Refinement Section */}
      {onRefine && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Text mit Prompt überarbeiten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Beschreibe, wie der Text überarbeitet werden soll...

Beispiele:
• Mache den Text emotionaler und füge mehr Storytelling hinzu
• Kürze den Text auf die Kernaussagen
• Füge mehr konkrete Zahlen und Studienergebnisse hinzu
• Verbessere die E-E-A-T Signale
• Schreibe den Intro-Absatz komplett neu"
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isRefining}
            />
            <Button 
              onClick={handleRefine} 
              disabled={!refinementPrompt.trim() || isRefining}
              className="w-full"
            >
              {isRefining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Überarbeite Text...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Text überarbeiten
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4 pt-4 border-t">
        {/* Export Actions */}
        <div className="flex gap-2 justify-center flex-wrap">
          <Button variant="outline" onClick={handleCopy} className="flex-1 max-w-[180px]">
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-500" />
                Kopiert!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Text kopieren
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="flex-1 max-w-[180px]">
            <Download className="mr-2 h-4 w-4" />
            PDF Export
          </Button>
          <Button variant="outline" onClick={handleExportDOCX} className="flex-1 max-w-[180px]">
            <FileDown className="mr-2 h-4 w-4" />
            Word Export
          </Button>
        </div>
        
        {/* Navigation Actions */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Zurück zum Text
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={onRegenerate}
              disabled={isRegenerating || isRefining}
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regeneriere...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Mit Verbesserungen regenerieren
                </>
              )}
            </Button>
            <Button onClick={onFinish} disabled={isRefining}>
              Abschließen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
