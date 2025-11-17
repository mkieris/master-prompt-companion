import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    try {
      const { data: scrapedData, error } = await supabase.functions.invoke("scrape-website", {
        body: { url: data.manufacturerWebsite, multiPage: false },
      });

      if (error) throw error;

      onUpdate({
        additionalInfo: data.additionalInfo + "\n\n=== Gescrapte Informationen ===\n" + scrapedData.content
      });

      toast({
        title: "Erfolgreich",
        description: "Website-Daten wurden erfolgreich geladen",
      });
    } catch (error) {
      console.error("Scraping error:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Website-Daten",
        variant: "destructive",
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

  const canProceed = data.manufacturerName && data.productName;

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
          <Label htmlFor="productName">Produkt Name *</Label>
          <Input
            id="productName"
            value={data.productName}
            onChange={(e) => onUpdate({ productName: e.target.value })}
            placeholder="z.B. InsulinPump X2000"
          />
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
