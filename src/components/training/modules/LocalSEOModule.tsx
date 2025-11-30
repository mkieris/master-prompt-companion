import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizQuestion } from "@/components/training/QuizQuestion";
import { BestPracticeCard } from "@/components/training/BestPracticeCard";
import { KeyTakeaway } from "@/components/training/KeyTakeaway";
import { 
  MapPin, Building2, Star, MessageSquare, CheckCircle2, 
  Phone, Clock, Image
} from "lucide-react";

export const LocalSEOModule = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Local SEO
          </CardTitle>
          <CardDescription>
            Für lokale Unternehmen: In der Google Maps-Suche und lokalen Ergebnissen gefunden werden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-2">Was ist Local SEO?</h3>
            <p className="text-muted-foreground text-sm">
              Local SEO optimiert Ihre Online-Präsenz für lokale Suchanfragen wie "Restaurant in meiner Nähe" oder "Zahnarzt München". 
              <strong className="text-foreground"> 46% aller Google-Suchen haben lokale Absicht!</strong>
            </p>
          </div>

          {/* Google Business Profile */}
          <Card className="bg-blue-500/5 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                Google Business Profile (früher: Google My Business)
              </CardTitle>
              <Badge className="bg-red-500">Absolut Pflicht!</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ihr Google Business Profile ist der wichtigste Faktor für Local SEO. Ohne Profil erscheinen Sie nicht im Local Pack!
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 bg-background rounded-lg border">
                  <h5 className="font-medium text-sm mb-2">📋 Profil-Checkliste:</h5>
                  <ul className="text-xs space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Korrekter Firmenname (exakt wie offline)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Vollständige Adresse</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Telefonnummer mit Ortsvorwahl</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Öffnungszeiten (auch Feiertage!)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Richtige Kategorien (Haupt + Neben)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Website-Link</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" />Beschreibung mit Keywords</li>
                  </ul>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <h5 className="font-medium text-sm mb-2">📸 Bilder hochladen:</h5>
                  <ul className="text-xs space-y-1">
                    <li className="flex items-center gap-2"><Image className="h-3 w-3 text-blue-500" />Logo (quadratisch, min. 250x250px)</li>
                    <li className="flex items-center gap-2"><Image className="h-3 w-3 text-blue-500" />Titelbild (1080x608px)</li>
                    <li className="flex items-center gap-2"><Image className="h-3 w-3 text-blue-500" />Außenansicht des Geschäfts</li>
                    <li className="flex items-center gap-2"><Image className="h-3 w-3 text-blue-500" />Innenansicht</li>
                    <li className="flex items-center gap-2"><Image className="h-3 w-3 text-blue-500" />Team-Fotos</li>
                    <li className="flex items-center gap-2"><Image className="h-3 w-3 text-blue-500" />Produkte/Dienstleistungen</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NAP Konsistenz */}
          <Card className="bg-green-500/5 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                NAP-Konsistenz
                <Badge className="bg-green-500">Ranking-Faktor</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                NAP steht für <strong>Name, Address, Phone</strong>. Diese Daten müssen überall im Web identisch sein!
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-background rounded-lg border text-center">
                  <Building2 className="h-6 w-6 mx-auto text-primary mb-2" />
                  <span className="font-semibold text-sm">Name</span>
                  <p className="text-xs text-muted-foreground">Exakter Firmenname</p>
                </div>
                <div className="p-3 bg-background rounded-lg border text-center">
                  <MapPin className="h-6 w-6 mx-auto text-primary mb-2" />
                  <span className="font-semibold text-sm">Address</span>
                  <p className="text-xs text-muted-foreground">Gleiche Schreibweise</p>
                </div>
                <div className="p-3 bg-background rounded-lg border text-center">
                  <Phone className="h-6 w-6 mx-auto text-primary mb-2" />
                  <span className="font-semibold text-sm">Phone</span>
                  <p className="text-xs text-muted-foreground">Mit Vorwahl</p>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg">
                <p className="text-sm">
                  <strong>💡 Wichtig:</strong> Prüfen Sie alle Verzeichnisse: Gelbe Seiten, Yelp, Branchenverzeichnisse, 
                  Social Media Profile – überall muss NAP identisch sein!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bewertungen */}
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Google-Bewertungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Bewertungen sind ein wichtiger Ranking-Faktor und beeinflussen die Klickrate massiv.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 bg-background rounded-lg border border-green-500/30">
                  <h5 className="font-medium text-sm text-green-700 mb-2">✓ So bekommen Sie mehr Bewertungen</h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Kunden nach positivem Erlebnis bitten</li>
                    <li>• QR-Code im Geschäft aufstellen</li>
                    <li>• Follow-up E-Mail mit Bewertungslink</li>
                    <li>• Link in E-Mail-Signatur</li>
                    <li>• Einfach machen (direkter Link)</li>
                  </ul>
                </div>
                <div className="p-3 bg-background rounded-lg border border-blue-500/30">
                  <h5 className="font-medium text-sm text-blue-700 mb-2">💬 Auf Bewertungen antworten</h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Auf ALLE Bewertungen antworten</li>
                    <li>• Positiv: Danken, persönlich antworten</li>
                    <li>• Negativ: Sachlich, Lösung anbieten</li>
                    <li>• Keywords natürlich einbauen</li>
                    <li>• Schnell reagieren (&lt;24h)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lokale Keywords */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-3">🔍 Lokale Keywords</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Integrieren Sie lokale Begriffe in Ihre Website:
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "[Service] + [Stadt]",
                "[Branche] in [Stadtteil]",
                "[Service] in meiner Nähe",
                "[Produkt] [Stadt] kaufen",
                "Bester [Service] [Stadt]"
              ].map((keyword) => (
                <Badge key={keyword} variant="outline" className="bg-background">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          <BestPracticeCard
            title="Local SEO"
            dos={[
              "Google Business Profile vollständig ausfüllen",
              "NAP überall konsistent halten",
              "Aktiv Bewertungen sammeln und beantworten",
              "Lokale Keywords auf der Website einbauen",
              "Regelmäßig Google Posts veröffentlichen",
              "In relevante Branchenverzeichnisse eintragen"
            ]}
            donts={[
              "Fake-Bewertungen kaufen (führt zu Sperre!)",
              "Verschiedene NAP-Varianten verwenden",
              "Negative Bewertungen ignorieren",
              "Profil unvollständig lassen",
              "Keyword-Stuffing im Firmennamen"
            ]}
            proTip="Beantworten Sie negative Bewertungen professionell – das zeigt anderen Nutzern, dass Sie sich um Kunden kümmern!"
          />

          <QuizQuestion
            question="Was ist der wichtigste Faktor für das Ranking im Google Local Pack?"
            options={[
              { id: "a", text: "Die Anzahl der Backlinks zur Website", isCorrect: false, explanation: "Backlinks sind wichtig, aber für Local SEO nicht der Hauptfaktor." },
              { id: "b", text: "Ein vollständiges Google Business Profile", isCorrect: true, explanation: "Richtig! Ohne optimiertes GBP erscheinen Sie gar nicht im Local Pack." },
              { id: "c", text: "Die Ladegeschwindigkeit der Website", isCorrect: false, explanation: "Wichtig für organische Rankings, aber nicht der Hauptfaktor für Local." },
              { id: "d", text: "Social Media Aktivität", isCorrect: false, explanation: "Social Media hat wenig direkten Einfluss auf Local SEO." }
            ]}
          />

          <KeyTakeaway
            points={[
              "Google Business Profile ist Pflicht für lokale Unternehmen",
              "NAP-Konsistenz: Name, Adresse, Telefon überall gleich",
              "Bewertungen aktiv sammeln und alle beantworten",
              "Lokale Keywords auf der Website integrieren",
              "Regelmäßig Google Posts veröffentlichen"
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};
