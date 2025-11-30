interface ExtractedData {
  pageType?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  targetAudience?: string;
  audienceType?: string;
  formOfAddress?: string;
  language?: string;
  tonality?: string;
  companyInfo?: string;
  productInfo?: string;
  productName?: string;
  brandName?: string;
  usps?: string[];
  searchIntent?: string[];
  wQuestions?: string[];
  wordCount?: string;
  headingStructure?: string;
  includeIntro?: boolean;
  includeFAQ?: boolean;
  keywordDensity?: string;
  pageGoal?: string;
  [key: string]: any;
}

interface ExtractedDataSummaryProps {
  data: ExtractedData;
}

const pageTypeLabels: Record<string, string> = {
  produktseite: "Produktseite",
  kategorieseite: "Kategorieseite",
  ratgeber: "Ratgeber/Blog",
  landingpage: "Landingpage",
};

const tonalityLabels: Record<string, string> = {
  "expert-mix": "Expertenmix",
  "consultant-mix": "Beratermix",
  "storytelling-mix": "Storytelling",
  "conversion-mix": "Conversion",
  "balanced-mix": "Balanced",
};

const ExtractedDataSummary = ({ data }: ExtractedDataSummaryProps) => {
  if (Object.keys(data).length === 0) return null;

  return (
    <div className="border-t bg-muted/50 p-3">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs text-muted-foreground mb-2">Erfasste Daten:</p>
        <div className="flex flex-wrap gap-2">
          {data.pageType && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              📄 {pageTypeLabels[data.pageType] || data.pageType}
            </span>
          )}
          {data.focusKeyword && (
            <span className="text-xs bg-accent/10 text-accent-foreground px-2 py-1 rounded-full">
              🎯 {data.focusKeyword}
            </span>
          )}
          {data.audienceType && (
            <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full">
              👥 {data.audienceType}
            </span>
          )}
          {data.formOfAddress && (
            <span className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
              💬 {data.formOfAddress === "du" ? "Du" : "Sie"}
            </span>
          )}
          {data.tonality && (
            <span className="text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
              🎭 {tonalityLabels[data.tonality] || data.tonality}
            </span>
          )}
          {data.wordCount && (
            <span className="text-xs bg-green-500/10 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
              📝 {data.wordCount} Wörter
            </span>
          )}
          {data.searchIntent && data.searchIntent.length > 0 && (
            <span className="text-xs bg-orange-500/10 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
              🔍 {data.searchIntent.join(", ")}
            </span>
          )}
          {data.includeFAQ && (
            <span className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full">
              ❓ FAQ
            </span>
          )}
          {data.brandName && (
            <span className="text-xs bg-pink-500/10 text-pink-700 dark:text-pink-300 px-2 py-1 rounded-full">
              🏷️ {data.brandName}
            </span>
          )}
        </div>
        {data.secondaryKeywords && data.secondaryKeywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground">Keywords:</span>
            {data.secondaryKeywords.map((kw, i) => (
              <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {kw}
              </span>
            ))}
          </div>
        )}
        {data.usps && data.usps.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground">USPs:</span>
            {data.usps.map((usp, i) => (
              <span key={i} className="text-xs bg-primary/5 px-1.5 py-0.5 rounded">
                ✓ {usp}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractedDataSummary;
