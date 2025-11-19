import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, X, Globe, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface Step1Data {
  manufacturerName: string;
  manufacturerWebsite: string;
  productName: string;
  productUrls: string[];
  additionalInfo: string;
  briefingFiles: string[];
}

interface Step1Props {
  data: Step1Data;
  onUpdate: (data: Partial<Step1Data>) => void;
  onNext: () => void;
}

export const Step1InfoGathering = ({ data, onUpdate, onNext }: Step1Props) => {
  const [isScraping, setIsScraping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scrapeMode, setScrapeMode] = useState<'single' | 'multi'>('single');
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [crawlStatus, setCrawlStatus] = useState("");
  const [crawledUrls, setCrawledUrls] = useState<string[]>([]);
  const { toast } = useToast();

  const handleScrapeWebsite = async () => {
    if (!data.manufacturerWebsite) {
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
      // Start the crawl/scrape
      const { data: startData, error: startError } = await supabase.functions.invoke("scrape-website", {
        body: { 
          url: data.manufacturerWebsite, 
          mode: scrapeMode,
          action: 'scrape'
        },
      });

      if (startError) throw startError;

      // For single page, we get immediate results
      if (scrapeMode === 'single') {
        setCrawlStatus("Analyse abgeschlossen");
        setCrawlProgress(100);
        
        processScrapedData(startData);
        return;
      }

      // For multi-page, we need to poll for status
      if (!startData.jobId) {
        throw new Error('Keine Job-ID erhalten');
      }

      const jobId = startData.jobId;
      setCrawlStatus("Crawle Website...");
      
      let attempts = 0;
      const maxAttempts = 180; // 6 minutes max (180 * 2s)
      let noProgressCount = 0;
      let lastCompleted = 0;

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

          // Update progress
          const completed = statusData.completed || 0;
          const total = statusData.total || 0;
          
          // Track progress
          if (completed === lastCompleted && completed > 0) {
            noProgressCount++;
          } else {
            noProgressCount = 0;
            lastCompleted = completed;
          }
          
          // Calculate progress (avoid division by zero)
          let progressPercent = 10; // Start with 10% minimum
          if (total > 0 && completed > 0) {
            progressPercent = Math.min(90, (completed / total) * 100);
          }
          
          setCrawlProgress(progressPercent);
          
          // Improved status messages with time estimate
          const estimatedTimeLeft = total > 0 && completed > 0 
            ? Math.ceil(((total - completed) * 8)) // ~8 seconds per page
            : 0;
          
          if (statusData.status === 'started') {
            setCrawlStatus('Website wird analysiert...');
          } else if (total === 0) {
            setCrawlStatus('Suche nach Seiten...');
          } else if (estimatedTimeLeft > 0) {
            setCrawlStatus(`${completed}/${total} Seiten • ~${estimatedTimeLeft}s verbleibend`);
          } else {
            setCrawlStatus(`${completed}/${total} Seiten gescraped`);
          }
          
          // Update crawled URLs live
          if (statusData.crawledUrls && Array.isArray(statusData.crawledUrls)) {
            setCrawledUrls(statusData.crawledUrls);
          }

          // Check if completed
          if (statusData.status === 'completed' && statusData.data) {
            setCrawlProgress(100);
            setCrawlStatus("Crawl abgeschlossen");
            processScrapedData(statusData.data);
            return;
          }

          // Check if failed
          if (statusData.status === 'failed') {
            throw new Error('Crawl fehlgeschlagen');
          }

          // Check if stuck (no progress for 30 seconds with pages found)
          if (noProgressCount > 15 && total > 0 && completed === 0) {
            throw new Error('Crawl macht keinen Fortschritt. Bitte versuchen Sie es mit Single-Page-Modus.');
          }

          // Continue polling for all active statuses
          const activeStatuses = ['started', 'scraping'];
          if (attempts < maxAttempts && activeStatuses.includes(statusData.status)) {
            setTimeout(pollStatus, 2000); // Poll every 2 seconds
          } else if (attempts >= maxAttempts) {
            throw new Error('Timeout - Crawl dauert zu lange. Bitte versuchen Sie Single-Page-Modus oder eine kleinere Website.');
          } else if (!activeStatuses.includes(statusData.status)) {
            throw new Error(`Unerwarteter Status: ${statusData.status}`);
          }
        } catch (error) {
          console.error('Status check error:', error);
          throw error;
        }
      };

      // Start polling after 5 seconds to give Firecrawl time to initialize
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
      // Auto-fill product information if detected
      const updates: Partial<Step1Data> = {
        additionalInfo: data.additionalInfo + "\n\n=== Gescrapte Informationen ===\n" + (scrapedData.content || scrapedData.summary || '')
      };

      // Auto-fill product name if detected and not already set
      if (scrapedData.detectedProducts) {
        const { isCategoryPage, category, detectedProducts } = scrapedData.detectedProducts;
        
        if (isCategoryPage && !data.productName) {
          updates.productName = category;
          updates.additionalInfo += `\n\n=== Automatisch erkannt ===\nSeitentyp: Kategorie/Shop-Seite\nKategorie: ${category}`;
        } else if (detectedProducts?.length > 0 && !data.productName) {
          updates.productName = detectedProducts[0].name;
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // Get current user
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
        // Include user_id in path for RLS policies
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

  const addProductUrl = () => {
    onUpdate({ productUrls: [...data.productUrls, ""] });
  };

  const updateProductUrl = (index: number, value: string) => {
    const newUrls = [...data.productUrls];
    newUrls[index] = value;
    onUpdate({ productUrls: newUrls });
  };

  const removeProductUrl = (index: number) => {
    onUpdate({ productUrls: data.productUrls.filter((_, i) => i !== index) });
  };

  const canProceed = data.manufacturerName; // Product name is now optional

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Schritt 1: Informationssammlung</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Sammeln Sie alle relevanten Informationen über Hersteller und Produkt
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="manufacturerName">Hersteller Name *</Label>
          <Input
            id="manufacturerName"
            value={data.manufacturerName}
            onChange={(e) => onUpdate({ manufacturerName: e.target.value })}
            placeholder="z.B. Medtronic"
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Scraping-Modus *</Label>
            <p className="text-xs text-muted-foreground">
              <strong>Single-Page:</strong> Schnell & zuverlässig (empfohlen für Start) • 
              <strong>Multi-Page:</strong> Gründlich, crawlt bis zu 10 Seiten (~2-3 Minuten)
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

          {isScraping && scrapeMode === 'multi' && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{crawlStatus}</span>
                <span className="text-muted-foreground">{crawlProgress}%</span>
              </div>
              <Progress value={crawlProgress} />
              
              {crawledUrls.length > 0 && (
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
          <Label htmlFor="manufacturerWebsite">Hersteller Website</Label>
          <div className="flex gap-2">
            <Input
              id="manufacturerWebsite"
              value={data.manufacturerWebsite}
              onChange={(e) => onUpdate({ manufacturerWebsite: e.target.value })}
              placeholder="https://..."
            />
            <Button
              type="button"
              onClick={handleScrapeWebsite}
              disabled={isScraping || !data.manufacturerWebsite}
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

        <div>
          <Label htmlFor="productName">Produktname / Kategorie (optional)</Label>
          <Input
            id="productName"
            value={data.productName}
            onChange={(e) => onUpdate({ productName: e.target.value })}
            placeholder="z.B. Smart Home Beleuchtungssystem oder Shop-Kategorie (wird automatisch erkannt)"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Wird automatisch beim Scrapen der Website erkannt. Kann auch leer bleiben für Kategorie-Seiten.
          </p>
        </div>

        <div>
          <Label>Produkt URLs</Label>
          <div className="space-y-2">
            {data.productUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => updateProductUrl(index, e.target.value)}
                  placeholder="https://..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProductUrl(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addProductUrl}>
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
            placeholder="Weitere relevante Informationen zum Produkt..."
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

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed}>
          Weiter zu Schritt 2
        </Button>
      </div>
    </div>
  );
};
