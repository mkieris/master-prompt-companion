import { FormData } from "@/components/SEOGeneratorFormPro";

/**
 * Demo-Daten für den Test-Modus des Pro Content Tools
 * Diese Daten können hier zentral angepasst werden
 */
export const DEMO_DATA: FormData = {
  // Step 1: Info Gathering
  pageType: 'product',
  brandName: "MedTech Solutions GmbH",
  websiteUrl: "https://www.medtech-solutions.de",
  mainTopic: "Chirurgische Präzisionsinstrumente der X-Serie",
  referenceUrls: [
    "https://www.medtech-solutions.de/produkte/x-serie",
    "https://www.medtech-solutions.de/technologie"
  ],
  additionalInfo: "Die X-Serie zeichnet sich durch höchste Präzision, ergonomisches Design und innovative Materialien aus. Zielgruppe sind Kliniken und chirurgische Praxen im DACH-Raum.",
  briefingFiles: [],
  competitorUrls: [
    "https://www.competitor1.de/chirurgie-instrumente",
    "https://www.competitor2.de/medizintechnik"
  ],
  competitorData: "",

  // Step 2: Target Audience
  targetAudience: "Chirurgen, OP-Leiter und Einkaufsverantwortliche in Kliniken und chirurgischen Praxen (B2B)",
  formOfAddress: "Sie",
  language: "de",
  tonality: "expertenmix",

  // Step 3: Text Structure
  focusKeyword: "chirurgische Präzisionsinstrumente",
  secondaryKeywords: [
    "OP-Instrumente",
    "Chirurgie-Werkzeuge",
    "Medizintechnik",
    "Präzisionschirurgie",
    "sterile Instrumente"
  ],
  searchIntent: ["informational", "commercial"],
  keywordDensity: "normal",
  wQuestions: [
    "Was sind chirurgische Präzisionsinstrumente?",
    "Welche Vorteile bieten Präzisionsinstrumente?",
    "Wie werden chirurgische Instrumente gereinigt?",
    "Welche Materialien werden verwendet?"
  ],
  contentStructure: "product-focused",
  contentLayout: "text-image-mixed",
  imageTextBlocks: 3,
  includeTabs: true,
  wordCount: "1500",
  maxParagraphLength: "300",
  headingStructure: "h2-h3",
  includeIntro: true,
  includeFAQ: true,
  pageGoal: "Produktinteresse wecken und Anfragen generieren",
  complianceChecks: {
    mdr: true,
    hwg: true,
    studies: false,
  },
};

/**
 * Funktion zum Abrufen der Demo-Daten
 * Kann erweitert werden für verschiedene Demo-Szenarien
 */
export const getDemoData = (scenario: 'default' | 'blog' | 'category' = 'default'): FormData => {
  // Hier könnten in Zukunft verschiedene Demo-Szenarien definiert werden
  switch (scenario) {
    case 'blog':
      return {
        ...DEMO_DATA,
        pageType: 'guide',
        mainTopic: "10 Tipps für erfolgreiche OP-Vorbereitung",
        pageGoal: "Expertise demonstrieren und Vertrauen aufbauen",
      };
    case 'category':
      return {
        ...DEMO_DATA,
        pageType: 'category',
        mainTopic: "Chirurgische Instrumente",
        pageGoal: "Produktkategorie übersichtlich präsentieren",
      };
    default:
      return DEMO_DATA;
  }
};
