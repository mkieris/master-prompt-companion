import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ClipboardList, Download, RotateCcw, Printer, CheckCircle2, FileText } from "lucide-react";
import { useState, useEffect } from "react";

interface ChecklistItem {
  id: string;
  text: string;
  priority: "must" | "should" | "nice";
}

interface ChecklistCategory {
  id: string;
  title: string;
  icon: string;
  items: ChecklistItem[];
}

const masterChecklistData: ChecklistCategory[] = [
  {
    id: "vor-dem-schreiben",
    title: "Vor dem Schreiben",
    icon: "🎯",
    items: [
      { id: "v1", text: "Search Intent analysiert (Know/Do/Buy/Go)", priority: "must" },
      { id: "v2", text: "Haupt-Keyword festgelegt", priority: "must" },
      { id: "v3", text: "Nebenkeywords und LSI-Keywords recherchiert", priority: "should" },
      { id: "v4", text: "Wettbewerber-Content analysiert", priority: "should" },
      { id: "v5", text: "Zielgruppe definiert", priority: "must" },
      { id: "v6", text: "Content-Typ passend zum Intent gewählt", priority: "must" },
    ]
  },
  {
    id: "ueberschriften",
    title: "Überschriften (H1-H6)",
    icon: "📋",
    items: [
      { id: "h1", text: "Nur EINE H1 pro Seite", priority: "must" },
      { id: "h2", text: "H1 enthält Haupt-Keyword", priority: "must" },
      { id: "h3", text: "H1 ist einzigartig und beschreibend", priority: "must" },
      { id: "h4", text: "Logische Hierarchie (H1→H2→H3)", priority: "must" },
      { id: "h5", text: "Überschriften allein ergeben Zusammenfassung", priority: "should" },
      { id: "h6", text: "Keywords natürlich in H2/H3 integriert", priority: "should" },
    ]
  },
  {
    id: "textstruktur",
    title: "Textstruktur",
    icon: "📝",
    items: [
      { id: "s1", text: "Erstes Wort/Satz enthält Keyword", priority: "must" },
      { id: "s2", text: "Erster Absatz fasst Kernaussage zusammen", priority: "must" },
      { id: "s3", text: "Absätze max. 300 Wörter", priority: "should" },
      { id: "s4", text: "Zwischenüberschriften alle 200-350 Wörter", priority: "should" },
      { id: "s5", text: "Inhaltsverzeichnis bei Texten >1000 Wörter", priority: "should" },
      { id: "s6", text: "Umgekehrte Pyramide: Wichtigstes zuerst", priority: "must" },
    ]
  },
  {
    id: "schreibstil",
    title: "Schreibstil & Lesbarkeit",
    icon: "✍️",
    items: [
      { id: "l1", text: "Aktivsätze statt Passiv verwendet", priority: "must" },
      { id: "l2", text: "Sätze max. 20 Wörter", priority: "should" },
      { id: "l3", text: "Flesch-Index über 60 (leicht lesbar)", priority: "should" },
      { id: "l4", text: "Füllwörter reduziert", priority: "should" },
      { id: "l5", text: "Fachbegriffe erklärt", priority: "should" },
      { id: "l6", text: "Direkte Ansprache der Zielgruppe", priority: "nice" },
    ]
  },
  {
    id: "keywords",
    title: "Keyword-Optimierung",
    icon: "🔑",
    items: [
      { id: "k1", text: "Keyword in H1", priority: "must" },
      { id: "k2", text: "Keyword im ersten Absatz", priority: "must" },
      { id: "k3", text: "Keyword-Dichte 1-2%", priority: "should" },
      { id: "k4", text: "Synonyme und Variationen verwendet", priority: "should" },
      { id: "k5", text: "LSI-Keywords integriert", priority: "nice" },
      { id: "k6", text: "Kein Keyword-Stuffing", priority: "must" },
    ]
  },
  {
    id: "formatierung",
    title: "Formatierung",
    icon: "🎨",
    items: [
      { id: "f1", text: "Fettdruck für wichtige Begriffe (sparsam)", priority: "should" },
      { id: "f2", text: "Aufzählungslisten für Punkte", priority: "should" },
      { id: "f3", text: "Tabellen für Vergleiche", priority: "nice" },
      { id: "f4", text: "Zitate/Callout-Boxen für Highlights", priority: "nice" },
      { id: "f5", text: "Keine Unterstreichungen (wirken wie Links)", priority: "must" },
    ]
  },
  {
    id: "meta",
    title: "Meta-Daten",
    icon: "🏷️",
    items: [
      { id: "m1", text: "Meta-Title: Keyword + max. 60 Zeichen", priority: "must" },
      { id: "m2", text: "Meta-Description: max. 160 Zeichen mit CTA", priority: "must" },
      { id: "m3", text: "URL enthält Keyword, kurz und lesbar", priority: "must" },
      { id: "m4", text: "Canonical-Tag gesetzt", priority: "should" },
      { id: "m5", text: "Open Graph Tags für Social Sharing", priority: "nice" },
    ]
  },
  {
    id: "medien",
    title: "Bilder & Medien",
    icon: "🖼️",
    items: [
      { id: "b1", text: "Alle Bilder haben Alt-Texte mit Keywords", priority: "must" },
      { id: "b2", text: "Bilder komprimiert (WebP bevorzugt)", priority: "should" },
      { id: "b3", text: "Dateinamen beschreibend (nicht IMG_1234)", priority: "should" },
      { id: "b4", text: "Lazy Loading aktiviert", priority: "should" },
      { id: "b5", text: "Mindestens 1 relevantes Bild pro 300 Wörter", priority: "nice" },
    ]
  },
  {
    id: "links",
    title: "Verlinkung",
    icon: "🔗",
    items: [
      { id: "li1", text: "Interne Links zu relevanten Seiten", priority: "must" },
      { id: "li2", text: "Externe Links zu vertrauenswürdigen Quellen", priority: "should" },
      { id: "li3", text: "Aussagekräftige Ankertexte (nicht 'hier klicken')", priority: "must" },
      { id: "li4", text: "Keine Broken Links", priority: "must" },
      { id: "li5", text: "Externe Links öffnen in neuem Tab", priority: "nice" },
    ]
  },
  {
    id: "eeat",
    title: "E-E-A-T & Trust",
    icon: "🛡️",
    items: [
      { id: "e1", text: "Autoreninfo vorhanden", priority: "should" },
      { id: "e2", text: "Quellen/Referenzen angegeben", priority: "should" },
      { id: "e3", text: "Datum der Veröffentlichung/Aktualisierung", priority: "should" },
      { id: "e4", text: "Expertise durch Inhalte demonstriert", priority: "must" },
      { id: "e5", text: "Bei YMYL: Besondere Sorgfalt", priority: "must" },
    ]
  },
  {
    id: "ki-content",
    title: "Bei KI-Unterstützung",
    icon: "🤖",
    items: [
      { id: "ki1", text: "Alle Fakten manuell verifiziert", priority: "must" },
      { id: "ki2", text: "Eigene Expertise/Erfahrung hinzugefügt", priority: "must" },
      { id: "ki3", text: "Einzigartige Perspektive eingebracht", priority: "should" },
      { id: "ki4", text: "Redaktionelle Überarbeitung durchgeführt", priority: "must" },
      { id: "ki5", text: "Stimme/Ton an Marke angepasst", priority: "should" },
    ]
  },
  {
    id: "final",
    title: "Finale Prüfung",
    icon: "✅",
    items: [
      { id: "fin1", text: "Text laut vorgelesen (klingt natürlich?)", priority: "should" },
      { id: "fin2", text: "Rechtschreibung & Grammatik geprüft", priority: "must" },
      { id: "fin3", text: "Mobile Ansicht getestet", priority: "must" },
      { id: "fin4", text: "Alle Links funktionieren", priority: "must" },
      { id: "fin5", text: "Ladezeit akzeptabel", priority: "should" },
      { id: "fin6", text: "Würde ich diesen Text teilen/empfehlen?", priority: "must" },
    ]
  },
];

export const MasterChecklist = () => {
  const storageKey = "seo-master-checklist";
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setCheckedItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(checkedItems));
  }, [checkedItems]);

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const resetChecklist = () => {
    setCheckedItems([]);
    localStorage.removeItem(storageKey);
  };

  const totalItems = masterChecklistData.reduce((acc, cat) => acc + cat.items.length, 0);
  const mustItems = masterChecklistData.reduce((acc, cat) => 
    acc + cat.items.filter(i => i.priority === "must").length, 0
  );
  const checkedMustItems = masterChecklistData.reduce((acc, cat) => 
    acc + cat.items.filter(i => i.priority === "must" && checkedItems.includes(i.id)).length, 0
  );
  const overallProgress = Math.round((checkedItems.length / totalItems) * 100);
  const mustProgress = Math.round((checkedMustItems / mustItems) * 100);

  const getCategoryProgress = (category: ChecklistCategory) => {
    const checked = category.items.filter(i => checkedItems.includes(i.id)).length;
    return Math.round((checked / category.items.length) * 100);
  };

  const printChecklist = () => {
    const printContent = `
      <html>
      <head>
        <title>SEO-Content Checkliste</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          h2 { color: #555; margin-top: 25px; display: flex; align-items: center; gap: 8px; }
          .category { margin-bottom: 20px; page-break-inside: avoid; }
          .item { display: flex; align-items: flex-start; gap: 10px; margin: 8px 0; padding: 5px 0; }
          .checkbox { width: 16px; height: 16px; border: 2px solid #999; border-radius: 3px; flex-shrink: 0; }
          .must { border-left: 3px solid #ef4444; padding-left: 10px; }
          .should { border-left: 3px solid #f59e0b; padding-left: 10px; }
          .nice { border-left: 3px solid #3b82f6; padding-left: 10px; }
          .legend { display: flex; gap: 20px; margin: 20px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
          .legend-item { display: flex; align-items: center; gap: 5px; font-size: 12px; }
          .legend-color { width: 12px; height: 12px; border-radius: 2px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>🎯 SEO-Content Checkliste</h1>
        <div class="legend">
          <div class="legend-item"><div class="legend-color" style="background:#ef4444"></div> MUSS</div>
          <div class="legend-item"><div class="legend-color" style="background:#f59e0b"></div> SOLLTE</div>
          <div class="legend-item"><div class="legend-color" style="background:#3b82f6"></div> OPTIONAL</div>
        </div>
        ${masterChecklistData.map(cat => `
          <div class="category">
            <h2>${cat.icon} ${cat.title}</h2>
            ${cat.items.map(item => `
              <div class="item ${item.priority}">
                <div class="checkbox"></div>
                <span>${item.text}</span>
              </div>
            `).join("")}
          </div>
        `).join("")}
      </body>
      </html>
    `;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const downloadAsText = () => {
    let text = "SEO-CONTENT CHECKLISTE\n" + "=".repeat(50) + "\n\n";
    text += "Legende: [M] = MUSS | [S] = SOLLTE | [O] = OPTIONAL\n\n";
    
    masterChecklistData.forEach(cat => {
      text += `\n${cat.icon} ${cat.title.toUpperCase()}\n${"-".repeat(30)}\n`;
      cat.items.forEach(item => {
        const priority = item.priority === "must" ? "[M]" : item.priority === "should" ? "[S]" : "[O]";
        text += `[ ] ${priority} ${item.text}\n`;
      });
    });
    
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seo-content-checkliste.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Master-Checkliste für SEO-Content
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetChecklist}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button variant="outline" size="sm" onClick={printChecklist}>
              <Printer className="h-4 w-4 mr-1" /> Drucken
            </Button>
            <Button variant="outline" size="sm" onClick={downloadAsText}>
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Gesamtfortschritt</span>
              <span className="font-semibold">{checkedItems.length}/{totalItems}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-red-700">MUSS-Punkte</span>
              <span className="font-semibold text-red-700">{checkedMustItems}/{mustItems}</span>
            </div>
            <div className="h-3 bg-red-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${mustProgress}%` }} />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Accordion type="multiple" value={expandedCategories} onValueChange={setExpandedCategories}>
          {masterChecklistData.map((category) => {
            const catProgress = getCategoryProgress(category);
            const catChecked = category.items.filter(i => checkedItems.includes(i.id)).length;
            
            return (
              <AccordionItem key={category.id} value={category.id} className="border rounded-lg mb-2 px-2">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xl">{category.icon}</span>
                    <span className="font-semibold text-sm">{category.title}</span>
                    <div className="flex-1 mx-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden max-w-[100px]">
                        <div 
                          className={`h-full transition-all duration-300 ${catProgress === 100 ? "bg-green-500" : "bg-primary"}`} 
                          style={{ width: `${catProgress}%` }} 
                        />
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {catChecked}/{category.items.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="space-y-1">
                    {category.items.map((item) => (
                      <label 
                        key={item.id} 
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border-l-3 ${
                          item.priority === "must" ? "border-l-red-500" : 
                          item.priority === "should" ? "border-l-amber-500" : "border-l-blue-500"
                        } ${checkedItems.includes(item.id) ? "bg-green-500/10" : "hover:bg-muted/50"}`}
                      >
                        <Checkbox 
                          checked={checkedItems.includes(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <span className={`text-sm flex-1 ${checkedItems.includes(item.id) ? "line-through text-muted-foreground" : ""}`}>
                          {item.text}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] ${
                            item.priority === "must" ? "bg-red-500/10 text-red-700 border-red-500/30" :
                            item.priority === "should" ? "bg-amber-500/10 text-amber-700 border-amber-500/30" :
                            "bg-blue-500/10 text-blue-700 border-blue-500/30"
                          }`}
                        >
                          {item.priority === "must" ? "MUSS" : item.priority === "should" ? "SOLLTE" : "OPTIONAL"}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {mustProgress === 100 && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-700">Alle MUSS-Punkte erfüllt!</p>
              <p className="text-sm text-muted-foreground">Ihr Content erfüllt die wichtigsten SEO-Kriterien.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
