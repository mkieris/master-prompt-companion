import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, X, Globe, CheckCircle2, Plus, Target, Search, Package, FolderTree, BookOpen, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import type { PageType } from "@/components/SEOGeneratorFormPro";

interface Step1Data {
  pageType: PageType;
  brandName: string;
  websiteUrl: string;
  mainTopic: string;
  referenceUrls: string[];
  additionalInfo: string;
  briefingFiles: string[];
  competitorUrls: string[];
  competitorData: string;
  promptVersion?: string;
}

interface Step1Props {
  data: Step1Data;
  onUpdate: (data: Partial<Step1Data>) => void;
  onNext: () => void;
}

// Labels und Placeholder je nach Seitentyp
const pageTypeConfig = {
  product: {
    icon: Package,
    title: "Produktseite",
    description: "Einzelnes Produkt mit Hersteller, Spezifikationen und Anwendungen",
    brandLabel: "Hersteller / Marke *",
    brandPlaceholder: "z.B. Medtronic, Bosch, Apple",
    brandRequired: true,
    topicLabel: "Produktname *",
    topicPlaceholder: "z.B. Smart Home Beleuchtungssystem",
    topicRequired: true,
    urlsLabel: "Produkt-URLs / Datenblätter",
    urlsPlaceholder: "https://produktseite.de/...",
  },
  category: {
    icon: FolderTree,
    title: "Kategorieseite",
    description: "Shop-Kategorie oder Produktübersicht, auch Multi-Brand",
    brandLabel: "Shop / Marke (optional)",
    brandPlaceholder: "z.B. MediaMarkt, eigener Shop-Name (bei Multi-Brand leer lassen)",
    brandRequired: false,
    topicLabel: "Kategoriename *",
    topicPlaceholder: "z.B. LED-Leuchten, Medizinprodukte Klasse II",
    topicRequired: true,
    urlsLabel: "Beispiel-Produkte / Unterseiten",
    urlsPlaceholder: "https://shop.de/kategorie/produkt...",
  },
  guide: {
    icon: BookOpen,
    title: "Ratgeber / Blog",
    description: "Informativer Artikel zu einem Thema ohne spezifisches Produkt",
    brandLabel: "Autor / Unternehmen (optional)",
    brandPlaceholder: "z.B. Dr. Müller, Firmenname",
    brandRequired: false,
    topicLabel: "Thema / Artikel-Titel *",
    topicPlaceholder: "z.B. Die richtige Beleuchtung für Ihr Büro",
    topicRequired: true,
    urlsLabel: "Quellen / Referenzen",
    urlsPlaceholder: "https://studie.de/..., https://fachmagazin.de/...",
  },
};

export const Step1InfoGathering = ({ data, onUpdate, onNext }: Step1Props) => {
  const [isScraping, setIsScraping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scrapeMode, setScrapeMode] = useState<'single' | 'multi'>('single');
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [crawlStatus, setCrawlStatus] = useState("");
  const [crawledUrls, setCrawledUrls] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState("");
  const [isCompetitorCrawling, setIsCompetitorCrawling] = useState(false);
  const [competitorCrawlStatus, setCompetitorCrawlStatus] = useState("");
  const { toast } = useToast();

  const config = pageTypeConfig[data.pageType];
  const IconComponent = config.icon;

  const promptVersions = [
    {
      id: 'v1-kompakt-seo',
      name: '🎯 Kompakt-SEO',
      description: 'Top 10 SEO-Faktoren, technisch präzise (aktueller Standard)',
      emoji: '🎯'
    },
    {
      id: 'v2-marketing-first',
      name: '🚀 Marketing-First',
      description: 'Emotionen & Überzeugungskraft > Technik. Texte die begeistern!',
      emoji: '🚀'
    },
    {
      id: 'v3-hybrid-intelligent',
      name: '🧠 Hybrid-Intelligent',
      description: 'Perfekte Balance: SEO-Technik + kreative Freiheit',
      emoji: '🧠'
    },
    {
      id: 'v4-minimal-kreativ',
      name: '✨ Minimal-Kreativ',
      description: 'Nur 5 Regeln, maximale Kreativität. Mutige Experimente!',
      emoji: '✨'
    },
    {
      id: 'v5-ai-meta-optimiert',
      name: '🤖 AI-Meta-Optimiert',
      description: 'Durch AI-Analyse optimierte Content-Formel',
      emoji: '🤖'
    },
    {
      id: 'v6-quality-auditor',
      name: '🔍 Quality-Auditor',
      description: 'Anti-Fluff Blacklist + AEO + Skimmability. Höchste Qualitätsstandards!',
      emoji: '🔍'
    }
  ];

  const handleScrapeWebsite = async () => {
    if (!data.websiteUrl) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Website-URL ein",
        variant: "destructive",
      });
      return;
    }

    setIsScraping(true);
    setCrawlProgress(0);
    setCrawlStatus("Starte Analyse...");
    setCrawledUrls([]);
    
    try {
      const { data: startData, error: startError } = await supabase.functions.invoke("scrape-website", {
        body: { 
          url: data.websiteUrl, 
          mode: scrapeMode,
          action: 'scrape'
        },
      });

      if (startError) throw startError;

      if (scrapeMode === 'single') {
        setCrawlStatus("Analyse abgeschlossen");
        setCrawlProgress(100);
        processScrapedData(startData);
        return;
      }

      if (!startData.jobId) {
        throw new Error('Keine Job-ID erhalten');
      }

      const jobId = startData.jobId;
      setCrawlStatus("Crawle Website...");
      
      let attempts = 0;
      const maxAttempts = 120;
      let noProgressCount = 0;
      let lastCompleted = 0;
      let stuckWithDataCount = 0;
      let highCompletionStuckCount = 0;

      const pollStatus = async () => {
        attempts++;
        
        try {
          const { data: statusData, error: statusError } = await supabase.functions.invoke("scrape-website", {
            body: { 
              action: 'check-status',
              jobId: jobId
            },
          });

          if (statusError) throw statusError;

          console.log('Crawl status:', statusData);

          const completed = statusData.completed || 0;
          const total = statusData.total || 0;
          const hasPartialData = statusData.hasPartialData || false;
          const partialDataCount = statusData.partialDataCount || 0;
          const completionRate = total > 0 ? (completed / total) * 100 : 0;
          
          if (completed === lastCompleted && completed > 0) {
            noProgressCount++;
            if (completionRate > 70 && partialDataCount >= 7) {
              highCompletionStuckCount++;
            }
          } else {
            noProgressCount = 0;
            highCompletionStuckCount = 0;
            lastCompleted = completed;
          }

          if (hasPartialData && partialDataCount > 0 && noProgressCount > 0) {
            stuckWithDataCount++;
          } else {
            stuckWithDataCount = 0;
          }
          
          let progressPercent = 10;
          if (total > 0 && completed > 0) {
            progressPercent = Math.min(90, (completed / total) * 100);
          } else if (partialDataCount > 0) {
            progressPercent = Math.min(50, partialDataCount * 10);
          }
          
          setCrawlProgress(progressPercent);
          
          if (statusData.status === 'started') {
            setCrawlStatus('🔍 Website wird analysiert...');
          } else if (total === 0 && partialDataCount === 0) {
            setCrawlStatus('🔎 Suche nach Seiten...');
          } else if (total > 0) {
            const estimatedTimeLeft = completed > 0 
              ? Math.ceil(((total - completed) * 8)) 
              : 0;
            
            if (completionRate > 85 && noProgressCount > 3) {
              setCrawlStatus(`⏳ ${completed}/${total} Seiten • Schließe ab (${Math.round(completionRate)}%)...`);
            } else if (highCompletionStuckCount > 7 && completionRate > 70) {
              setCrawlStatus(`⏳ ${completed}/${total} Seiten • Fast fertig (${Math.round(completionRate)}%)`);
            } else if (noProgressCount > 10 && partialDataCount > 0) {
              setCrawlStatus(`⚠️ ${completed}/${total} Seiten • Verwendet vorhandene Daten`);
            } else if (estimatedTimeLeft > 0) {
              setCrawlStatus(`📄 ${completed}/${total} Seiten • ~${estimatedTimeLeft}s verbleibend`);
            } else {
              setCrawlStatus(`✓ ${completed}/${total} Seiten gescraped`);
            }
          } else if (partialDataCount > 0) {
            setCrawlStatus(`📋 ${partialDataCount} Seiten gefunden...`);
          }
          
          if (statusData.crawledUrls && Array.isArray(statusData.crawledUrls)) {
            setCrawledUrls(statusData.crawledUrls);
          }

          if (statusData.status === 'completed' && statusData.data) {
            setCrawlProgress(100);
            setCrawlStatus("Crawl abgeschlossen");
            processScrapedData(statusData.data);
            return;
          }

          if (statusData.status === 'failed') {
            throw new Error('Crawl fehlgeschlagen');
          }

          const shouldUsePartial = 
            (completionRate > 85 && noProgressCount > 3 && partialDataCount >= 8) ||
            (completionRate > 70 && highCompletionStuckCount > 7 && partialDataCount >= 7) ||
            (stuckWithDataCount > 15 && partialDataCount >= 5) ||
            (noProgressCount > 20 && partialDataCount >= 3);
          
          if (shouldUsePartial) {
            console.log(`✅ Using partial results: ${partialDataCount} pages (completion: ${Math.round(completionRate)}%)`);
            setCrawlProgress(100);
            setCrawlStatus(`✓ ${partialDataCount} Seiten erfolgreich geladen`);
            
            const { data: partialData, error: partialError } = await supabase.functions.invoke("scrape-website", {
              body: { 
                action: 'use-partial',
                jobId: jobId
              },
            });

            if (partialError) {
              console.error('Error getting partial results:', partialError);
              throw partialError;
            }
            
            processScrapedData(partialData.data);
            
            toast({
              title: "✓ Erfolgreich abgeschlossen",
              description: `${partialDataCount} Seiten wurden analysiert und zusammengefasst.`,
            });
            return;
          }

          if (noProgressCount > 25 && partialDataCount < 3) {
            throw new Error('❌ Crawl macht keinen Fortschritt. Bitte versuchen Sie Single-Page-Modus.');
          }

          const activeStatuses = ['started', 'scraping'];
          if (attempts < maxAttempts && activeStatuses.includes(statusData.status)) {
            setTimeout(pollStatus, 2000);
          } else if (attempts >= maxAttempts) {
            if (partialDataCount >= 3) {
              console.log(`⏱️ Timeout reached, using partial results: ${partialDataCount} pages`);
              
              const { data: partialData, error: partialError } = await supabase.functions.invoke("scrape-website", {
                body: { 
                  action: 'use-partial',
                  jobId: jobId
                },
              });

              if (!partialError && partialData) {
                processScrapedData(partialData.data);
                toast({
                  title: "✓ Erfolgreich abgeschlossen",
                  description: `${partialDataCount} Seiten wurden analysiert (Timeout erreicht).`,
                });
                return;
              }
            }
            throw new Error('⏱️ Timeout - Crawl dauert zu lange. Bitte versuchen Sie Single-Page-Modus.');
          } else if (!activeStatuses.includes(statusData.status)) {
            throw new Error(`❌ Unerwarteter Status: ${statusData.status}`);
          }
        } catch (error) {
          console.error('Status check error:', error);
          throw error;
        }
      };

      setTimeout(pollStatus, 5000);

    } catch (error) {
      console.error("Scraping error:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Website-Daten",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
      setCrawlStatus("");
      setCrawlProgress(0);
      setCrawledUrls([]);
    }
  };

  const processScrapedData = (scrapedData: any) => {
    try {
      const updates: Partial<Step1Data> = {
        additionalInfo: data.additionalInfo + "\n\n=== Gescrapte Informationen ===\n" + (scrapedData.content || scrapedData.summary || '')
      };

      if (scrapedData.detectedProducts) {
        const { isCategoryPage, category, detectedProducts } = scrapedData.detectedProducts;
        
        // Auto-detect page type based on scraped content
        if (isCategoryPage && !data.mainTopic) {
          updates.mainTopic = category;
          updates.pageType = 'category'; // Auto-switch to category
          updates.additionalInfo += `\n\n=== Automatisch erkannt ===\nSeitentyp: Kategorie/Shop-Seite\nKategorie: ${category}`;
        } else if (detectedProducts?.length > 0 && !data.mainTopic) {
          updates.mainTopic = detectedProducts[0].name;
          updates.additionalInfo += `\n\n=== Automatisch erkannte Produkte ===\n${detectedProducts.map((p: any, i: number) => `${i + 1}. ${p.name}`).join('\n')}`;
        }
      }

      onUpdate(updates);

      toast({
        title: "Erfolgreich",
        description: scrapedData.pageCount
          ? `${scrapedData.pageCount} Seiten wurden analysiert`
          : scrapedData.detectedProducts?.isCategoryPage 
            ? "Kategorie-Seite erkannt und Daten geladen"
            : "Website-Daten wurden erfolgreich geladen",
      });
    } catch (error) {
      console.error("Error processing scraped data:", error);
      toast({
        title: "Warnung",
        description: "Daten wurden geladen, aber einige Informationen konnten nicht verarbeitet werden",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const addCompetitor = () => {
    if (competitorInput.trim() && data.competitorUrls.length < 3) {
      const url = competitorInput.trim().startsWith('http') 
        ? competitorInput.trim() 
        : `https://${competitorInput.trim()}`;
      
      onUpdate({
        competitorUrls: [...data.competitorUrls, url]
      });
      setCompetitorInput("");
    }
  };

  const removeCompetitor = (index: number) => {
    const newUrls = data.competitorUrls.filter((_, i) => i !== index);
    onUpdate({ competitorUrls: newUrls });
  };

  const crawlCompetitors = async () => {
    if (data.competitorUrls.length === 0) return;

    setIsCompetitorCrawling(true);
    setCompetitorCrawlStatus("🔍 Starte Konkurrenten-Analyse...");

    try {
      const crawlPromises = data.competitorUrls.map(async (url, index) => {
        setCompetitorCrawlStatus(`📊 Analysiere Konkurrent ${index + 1}/${data.competitorUrls.length}...`);
        
        const { data: crawlData, error } = await supabase.functions.invoke("scrape-website", {
          body: { url, crawlSubpages: false, mode: 'single', action: 'scrape' }
        });

        if (error) throw error;

        if (crawlData.success && crawlData.content) {
          return `\n=== KONKURRENT ${index + 1}: ${url} ===\n${crawlData.content.substring(0, 5000)}`;
        }
        return null;
      });

      const results = await Promise.all(crawlPromises);
      const combinedData = results.filter(Boolean).join("\n\n");

      if (combinedData) {
        onUpdate({ competitorData: `=== KONKURRENTEN-ANALYSE ===\n\nFolgende Best Practices wurden von ${data.competitorUrls.length} Konkurrenten extrahiert:\n${combinedData}\n\nNutze diese Erkenntnisse für bessere Keyword-Strategien, Content-Strukturen und Argumentationsmuster.` });
        
        toast({
          title: "✅ Konkurrenten analysiert",
          description: `${data.competitorUrls.length} Website(s) erfolgreich gecrawlt`,
        });
      }

      setCompetitorCrawlStatus("");
    } catch (error) {
      console.error("Competitor crawl error:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Analysieren der Konkurrenten",
        variant: "destructive",
      });
      setCompetitorCrawlStatus("");
    } finally {
      setIsCompetitorCrawling(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Fehler",
          description: "Sie müssen angemeldet sein, um Dateien hochzuladen",
          variant: "destructive",
        });
        return;
      }

      const uploadedPaths: string[] = [];

      for (const file of Array.from(files)) {
        const fileName = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("briefings")
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        uploadedPaths.push(fileName);
      }

      onUpdate({ briefingFiles: [...data.briefingFiles, ...uploadedPaths] });

      toast({
        title: "Erfolgreich",
        description: `${uploadedPaths.length} Datei(en) hochgeladen`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Hochladen der Dateien",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async (fileName: string) => {
    try {
      await supabase.storage.from("briefings").remove([fileName]);
      onUpdate({
        briefingFiles: data.briefingFiles.filter(f => f !== fileName)
      });
    } catch (error) {
      console.error("Remove file error:", error);
    }
  };

  const addReferenceUrl = () => {
    onUpdate({ referenceUrls: [...data.referenceUrls, ""] });
  };

  const updateReferenceUrl = (index: number, value: string) => {
    const newUrls = [...data.referenceUrls];
    newUrls[index] = value;
    onUpdate({ referenceUrls: newUrls });
  };

  const removeReferenceUrl = (index: number) => {
    onUpdate({ referenceUrls: data.referenceUrls.filter((_, i) => i !== index) });
  };

  // Validation based on page type
  const canProceed = config.topicRequired 
    ? data.mainTopic.trim() !== '' 
    : true;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Schritt 1: Informationssammlung</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Wählen Sie den Seitentyp und sammeln Sie alle relevanten Informationen
        </p>
      </div>

      {/* Page Type Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Seitentyp auswählen *</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.keys(pageTypeConfig) as PageType[]).map((type) => {
            const typeConfig = pageTypeConfig[type];
            const TypeIcon = typeConfig.icon;
            const isSelected = data.pageType === type;
            
            return (
              <Card
                key={type}
                className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
                  isSelected 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'hover:bg-muted/30'
                }`}
                onClick={() => onUpdate({ pageType: type })}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{typeConfig.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {typeConfig.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* AI PROMPT VERSION AUSWAHL */}
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <Label className="text-base font-semibold">AI-Prompt-Version (BETA)</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Wählen Sie die AI-Strategie: Von technisch-präzise bis maximal-kreativ. Testen Sie verschiedene Ansätze!
          </p>
          <div className="grid grid-cols-1 gap-3 mt-3">
            {promptVersions.map((version) => {
              const isSelected = (data.promptVersion || 'v1-kompakt-seo') === version.id;
              return (
                <Card
                  key={version.id}
                  className={`p-4 cursor-pointer transition-all border-2 hover:border-primary/50 hover:bg-primary/5 ${
                    isSelected 
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                      : 'border-border'
                  }`}
                  onClick={() => onUpdate({ promptVersion: version.id })}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{version.emoji}</span>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {version.name}
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {version.description}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="border-t pt-6 space-y-4">
        {/* Brand/Author Name - conditional based on page type */}
        <div>
          <Label htmlFor="brandName">{config.brandLabel}</Label>
          <Input
            id="brandName"
            value={data.brandName}
            onChange={(e) => onUpdate({ brandName: e.target.value })}
            placeholder={config.brandPlaceholder}
          />
        </div>

        {/* Website URL with Scraping */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Scraping-Modus</Label>
            <p className="text-xs text-muted-foreground">
              <strong>Single-Page:</strong> Schnell & zuverlässig • 
              <strong> Multi-Page:</strong> Gründlich, crawlt bis zu 10 Seiten (~2-3 Minuten)
            </p>
            <RadioGroup 
              value={scrapeMode} 
              onValueChange={(value: 'single' | 'multi') => setScrapeMode(value)}
              disabled={isScraping}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="font-normal cursor-pointer">
                  Einzelne Seite - Schnell, nur die eingegebene URL
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multi" id="multi" />
                <Label htmlFor="multi" className="font-normal cursor-pointer">
                  Multi-Page - Crawlt bis zu 10 Seiten (2-3 Minuten)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {isScraping && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {crawlStatus || (scrapeMode === 'single' ? 'Analysiere Seite...' : 'Crawle Website...')}
                </span>
                {scrapeMode === 'multi' && (
                  <span className="text-muted-foreground">{crawlProgress}%</span>
                )}
              </div>
              <Progress value={scrapeMode === 'single' ? undefined : crawlProgress} />
              
              {scrapeMode === 'multi' && crawledUrls.length > 0 && (
                <Card className="p-3 bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">Gefundene Seiten ({crawledUrls.length})</span>
                  </div>
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {crawledUrls.map((url, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground break-all line-clamp-1">{url}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              )}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="websiteUrl">Website URL</Label>
          <div className="flex gap-2">
            <Input
              id="websiteUrl"
              value={data.websiteUrl}
              onChange={(e) => onUpdate({ websiteUrl: e.target.value })}
              placeholder="https://..."
            />
            <Button
              type="button"
              onClick={handleScrapeWebsite}
              disabled={isScraping || !data.websiteUrl}
              variant="outline"
            >
              {isScraping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Main Topic - dynamic label based on page type */}
        <div>
          <Label htmlFor="mainTopic">{config.topicLabel}</Label>
          <Input
            id="mainTopic"
            value={data.mainTopic}
            onChange={(e) => onUpdate({ mainTopic: e.target.value })}
            placeholder={config.topicPlaceholder}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Wird automatisch beim Scrapen der Website erkannt, falls vorhanden.
          </p>
        </div>

        {/* Reference URLs - dynamic label */}
        <div>
          <Label>{config.urlsLabel}</Label>
          <div className="space-y-2">
            {data.referenceUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => updateReferenceUrl(index, e.target.value)}
                  placeholder={config.urlsPlaceholder}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeReferenceUrl(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addReferenceUrl}>
              + URL hinzufügen
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="additionalInfo">Zusätzliche Informationen</Label>
          <Textarea
            id="additionalInfo"
            value={data.additionalInfo}
            onChange={(e) => onUpdate({ additionalInfo: e.target.value })}
            placeholder={
              data.pageType === 'product' 
                ? "Weitere relevante Informationen zum Produkt..." 
                : data.pageType === 'category'
                ? "Informationen zur Kategorie, Sortiment, Zielgruppe..."
                : "Kontext zum Thema, wichtige Punkte, Quellen..."
            }
            rows={6}
          />
        </div>

        <div>
          <Label>Briefing-Dateien hochladen</Label>
          <Input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          {data.briefingFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {data.briefingFiles.map((file) => (
                <div key={file} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                  <span className="truncate">{file}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Competitor Analysis Section */}
      <div className="space-y-4 border-t pt-6">
        <div className="flex items-start gap-2">
          <Target className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <Label className="text-base font-semibold">Konkurrenten analysieren (Optional)</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Füge bis zu 3 Konkurrenten-URLs hinzu, um Best Practices für deinen Content zu extrahieren
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="https://konkurrent.de"
              value={competitorInput}
              onChange={(e) => setCompetitorInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
              disabled={data.competitorUrls.length >= 3 || isCompetitorCrawling}
            />
            <Button
              onClick={addCompetitor}
              disabled={!competitorInput.trim() || data.competitorUrls.length >= 3 || isCompetitorCrawling}
              variant="outline"
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {data.competitorUrls.length > 0 && (
            <div className="space-y-2">
              {data.competitorUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md">
                  <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm flex-1 truncate">{url}</span>
                  <Button
                    onClick={() => removeCompetitor(index)}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={isCompetitorCrawling}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              <Button
                onClick={crawlCompetitors}
                disabled={isCompetitorCrawling}
                variant="secondary"
                className="w-full"
              >
                {isCompetitorCrawling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {competitorCrawlStatus}
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Konkurrenten analysieren
                  </>
                )}
              </Button>

              {data.competitorData && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Konkurrenten-Analyse abgeschlossen • Best Practices wurden extrahiert
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed}>
          Weiter zu Schritt 2
        </Button>
      </div>
    </div>
  );
};
