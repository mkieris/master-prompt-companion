interface ExtractedData {
  pageType?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  targetAudience?: string;
  audienceType?: string;
  tonality?: string;
  companyInfo?: string;
  productInfo?: string;
  usps?: string[];
  searchIntent?: string[];
  wQuestions?: string[];
  [key: string]: any;
}

interface ExtractedDataSummaryProps {
  data: ExtractedData;
}

const ExtractedDataSummary = ({ data }: ExtractedDataSummaryProps) => {
  if (Object.keys(data).length === 0) return null;

  return (
    <div className="border-t bg-muted/50 p-3">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs text-muted-foreground mb-2">Erfasste Daten:</p>
        <div className="flex flex-wrap gap-2">
          {data.pageType && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              📄 {data.pageType}
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
          {data.tonality && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              🎭 {data.tonality}
            </span>
          )}
          {data.searchIntent && data.searchIntent.length > 0 && (
            <span className="text-xs bg-accent/10 text-accent-foreground px-2 py-1 rounded-full">
              🔍 {data.searchIntent.join(", ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtractedDataSummary;
