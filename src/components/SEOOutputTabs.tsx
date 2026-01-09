import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

export interface GeneratedContent {
  seoText: string;
  faq: Array<{ question: string; answer: string }>;
  title: string;
  metaDescription: string;
  internalLinks: Array<{ url: string; anchorText: string }>;
  technicalHints: string;
  qualityReport?: {
    status: "green" | "yellow" | "red";
    flags: Array<{
      type: "mdr" | "hwg" | "study";
      severity: "high" | "medium" | "low";
      issue: string;
      rewrite: string;
    }>;
    evidenceTable?: Array<{
      study: string;
      type: string;
      population: string;
      outcome: string;
      effect: string;
      limitations: string;
      source: string;
    }>;
  };
}

interface SEOOutputTabsProps {
  content: GeneratedContent | null;
}

// Helper function to convert Markdown tables to HTML
const convertMarkdownTablesToHtml = (text: string): string => {
  if (!text) return '';
  
  // Split by lines
  const lines = text.split('\n');
  let result: string[] = [];
  let inTable = false;
  let tableLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line is a table row (starts and ends with |)
    const isTableRow = line.startsWith('|') && line.endsWith('|');
    // Check if this is a separator row (contains only |, -, :, and spaces)
    const isSeparatorRow = /^\|[-:\s|]+\|$/.test(line);
    
    if (isTableRow) {
      if (!inTable) {
        inTable = true;
        tableLines = [];
      }
      tableLines.push(line);
    } else {
      if (inTable && tableLines.length > 0) {
        // Convert collected table lines to HTML
        result.push(convertTableToHtml(tableLines));
        tableLines = [];
        inTable = false;
      }
      result.push(lines[i]);
    }
  }
  
  // Handle table at end of text
  if (inTable && tableLines.length > 0) {
    result.push(convertTableToHtml(tableLines));
  }
  
  return result.join('\n');
};

const convertTableToHtml = (tableLines: string[]): string => {
  if (tableLines.length < 2) return tableLines.join('\n');
  
  let html = '<table class="w-full border-collapse my-4 text-sm">';
  
  for (let i = 0; i < tableLines.length; i++) {
    const line = tableLines[i];
    
    // Skip separator rows
    if (/^\|[-:\s|]+\|$/.test(line)) continue;
    
    const cells = line
      .split('|')
      .filter((cell, idx, arr) => idx > 0 && idx < arr.length - 1)
      .map(cell => cell.trim());
    
    if (i === 0) {
      // Header row
      html += '<thead class="bg-muted"><tr>';
      cells.forEach(cell => {
        html += `<th class="border border-border p-2 text-left font-medium">${cell}</th>`;
      });
      html += '</tr></thead><tbody>';
    } else {
      // Data row
      html += '<tr class="border-b border-border hover:bg-muted/50">';
      cells.forEach(cell => {
        html += `<td class="border border-border p-2">${cell}</td>`;
      });
      html += '</tr>';
    }
  }
  
  html += '</tbody></table>';
  return html;
};

export const SEOOutputTabs = ({ content }: SEOOutputTabsProps) => {
  if (!content) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Kein Inhalt generiert</p>
          <p className="text-sm">Füllen Sie das Formular aus und klicken Sie auf "SEO-Text generieren"</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: "green" | "yellow" | "red") => {
    switch (status) {
      case "green":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "yellow":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "red":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getSeverityBadge = (severity: "high" | "medium" | "low") => {
    const variants = {
      high: "destructive",
      medium: "warning" as any,
      low: "secondary",
    };
    return <Badge variant={variants[severity]}>{severity === "high" ? "Hoch" : severity === "medium" ? "Mittel" : "Niedrig"}</Badge>;
  };

  return (
    <Tabs defaultValue="text" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="text">SEO-Text</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
        <TabsTrigger value="meta">Title & Meta</TabsTrigger>
        <TabsTrigger value="links">Links</TabsTrigger>
        <TabsTrigger value="quality">Qualität</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-y-auto p-6">
        <TabsContent value="text" className="mt-0">
          <Card className="p-6">
            <div 
              className="prose prose-sm max-w-none" 
              dangerouslySetInnerHTML={{ 
                __html: typeof content.seoText === 'string' ? convertMarkdownTablesToHtml(content.seoText) : ''
              }} 
            />
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="mt-0">
          <Card className="p-6 space-y-4">
            {Array.isArray(content.faq) && content.faq.map((item, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-semibold text-foreground">
                  {typeof item?.question === 'string' ? item.question : ''}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {typeof item?.answer === 'string' ? item.answer : ''}
                </p>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="meta" className="mt-0">
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Title Tag</h3>
              <p className="text-sm text-foreground">{content.title || ''}</p>
              <p className="text-xs text-muted-foreground mt-1">Länge: {(content.title || '').length} Zeichen</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Meta Description</h3>
              <p className="text-sm text-foreground">{content.metaDescription || ''}</p>
              <p className="text-xs text-muted-foreground mt-1">Länge: {(content.metaDescription || '').length} Zeichen</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Technik-Hinweise</h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {typeof content.technicalHints === 'string' 
                  ? content.technicalHints 
                  : JSON.stringify(content.technicalHints, null, 2)}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="links" className="mt-0">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Interne Links</h3>
            <div className="space-y-3">
              {Array.isArray(content.internalLinks) && content.internalLinks.map((link, index) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <p className="text-sm font-medium text-foreground">
                    {typeof link?.anchorText === 'string' ? link.anchorText : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {typeof link?.url === 'string' ? link.url : ''}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="mt-0">
          <div className="space-y-4">
            {content.qualityReport && (
              <>
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    {getStatusIcon(content.qualityReport.status)}
                    <h3 className="font-semibold text-lg">
                      Compliance-Status:{" "}
                      {content.qualityReport.status === "green"
                        ? "Konform"
                        : content.qualityReport.status === "yellow"
                        ? "Unklar"
                        : "Verstöße"}
                    </h3>
                  </div>

                  {content.qualityReport.flags.length > 0 && (
                    <div className="space-y-4">
                      {content.qualityReport.flags.map((flag, index) => (
                        <div key={index} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {flag.type === "mdr" ? "MDR/MPDG" : flag.type === "hwg" ? "HWG" : "Studien"}
                              </Badge>
                              {getSeverityBadge(flag.severity)}
                            </div>
                          </div>
                          <h4 className="font-medium mb-2 text-foreground">Problem</h4>
                          <p className="text-sm text-muted-foreground mb-3">{flag.issue}</p>
                          <h4 className="font-medium mb-2 text-foreground">Empfohlene Umformulierung</h4>
                          <p className="text-sm text-success bg-success/10 p-3 rounded">{flag.rewrite}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {content.qualityReport.evidenceTable && content.qualityReport.evidenceTable.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-4">Evidenz-Tabelle</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="p-2 text-left">Studie</th>
                              <th className="p-2 text-left">Typ</th>
                              <th className="p-2 text-left">Population</th>
                              <th className="p-2 text-left">Outcome</th>
                              <th className="p-2 text-left">Effekt</th>
                              <th className="p-2 text-left">Einschränkungen</th>
                              <th className="p-2 text-left">Quelle</th>
                            </tr>
                          </thead>
                          <tbody>
                            {content.qualityReport.evidenceTable.map((row, index) => (
                              <tr key={index} className="border-b border-border">
                                <td className="p-2">{row.study}</td>
                                <td className="p-2">{row.type}</td>
                                <td className="p-2">{row.population}</td>
                                <td className="p-2">{row.outcome}</td>
                                <td className="p-2">{row.effect}</td>
                                <td className="p-2">{row.limitations}</td>
                                <td className="p-2">{row.source}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="p-6 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    <strong>Hinweis:</strong> Werbeaussagen müssen mit Zweckbestimmung übereinstimmen; finale
                    juristische Prüfung empfohlen.
                  </p>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
};
