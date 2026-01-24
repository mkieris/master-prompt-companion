import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// German stopwords to filter out
const GERMAN_STOPWORDS = new Set([
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einer", "eines", "einem", "einen",
  "und", "oder", "aber", "doch", "wenn", "weil", "dass", "ob", "als", "wie", "was", "wer",
  "wo", "wann", "warum", "welche", "welcher", "welches", "welchen", "welchem",
  "ich", "du", "er", "sie", "es", "wir", "ihr", "sie", "Sie",
  "mein", "dein", "sein", "ihr", "unser", "euer", "Ihr",
  "mir", "dir", "ihm", "uns", "euch", "ihnen", "Ihnen",
  "mich", "dich", "ihn", "uns", "euch",
  "ist", "sind", "war", "waren", "wird", "werden", "wurde", "wurden",
  "hat", "haben", "hatte", "hatten", "kann", "können", "konnte", "konnten",
  "muss", "müssen", "musste", "mussten", "soll", "sollen", "sollte", "sollten",
  "will", "wollen", "wollte", "wollten", "darf", "dürfen", "durfte", "durften",
  "mag", "mögen", "mochte", "mochten", "möchte", "möchten",
  "sein", "haben", "werden", "können", "müssen", "sollen", "wollen", "dürfen",
  "nicht", "auch", "nur", "noch", "schon", "immer", "sehr", "mehr", "viel",
  "so", "ja", "nein", "denn", "dann", "dort", "hier", "jetzt", "heute", "gestern", "morgen",
  "für", "mit", "bei", "von", "zu", "aus", "nach", "vor", "über", "unter", "zwischen",
  "durch", "gegen", "ohne", "um", "an", "auf", "in", "bis", "seit", "während",
  "alle", "alles", "andere", "anderen", "anderer", "anderes",
  "dieser", "diese", "dieses", "diesen", "diesem",
  "jeder", "jede", "jedes", "jeden", "jedem",
  "kein", "keine", "keiner", "keines", "keinen", "keinem",
  "man", "sich", "selbst", "wieder", "schon", "ganz", "gar",
  "sowie", "bzw", "usw", "etc", "ggf", "evtl", "ca", "z.b.", "d.h.",
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be", "been",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "about"
]);

// Input validation schema
const requestSchema = z.object({
  keyword: z.string().min(1, "Keyword is required").max(200, "Keyword too long"),
  country: z.string().default("de"),
  language: z.string().default("de"),
  numResults: z.number().min(1).max(20).default(10),
});

// Response type interfaces
interface SerpResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface PeopleAlsoAsk {
  question: string;
  snippet?: string;
}

interface TermAnalysis {
  mustHave: string[];
  shouldHave: string[];
  niceToHave: string[];
}

interface AnalyzeSerpResponse {
  keyword: string;
  termAnalysis: TermAnalysis;
  peopleAlsoAsk: PeopleAlsoAsk[];
  competitorHeadlines: string[];
  organicResults: SerpResult[];
  totalResults?: number;
}

// Extract and count terms from text
function extractTerms(texts: string[]): Map<string, number> {
  const termCounts = new Map<string, number>();
  
  texts.forEach(text => {
    if (!text) return;
    
    // Clean and tokenize text
    const words = text
      .toLowerCase()
      .replace(/[^\wäöüßÄÖÜ\s-]/g, " ")
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !GERMAN_STOPWORDS.has(word) &&
        !/^\d+$/.test(word)
      );
    
    words.forEach(word => {
      termCounts.set(word, (termCounts.get(word) || 0) + 1);
    });
  });
  
  return termCounts;
}

// Categorize terms based on frequency
function categorizeTerms(termCounts: Map<string, number>, totalDocs: number): TermAnalysis {
  const sortedTerms = [...termCounts.entries()]
    .sort((a, b) => b[1] - a[1]);
  
  const mustHave: string[] = [];
  const shouldHave: string[] = [];
  const niceToHave: string[] = [];
  
  sortedTerms.forEach(([term, count]) => {
    const frequency = count / totalDocs;
    
    // Must have: appears in 70%+ of results
    if (frequency >= 0.7 && mustHave.length < 15) {
      mustHave.push(term);
    }
    // Should have: appears in 40-70% of results  
    else if (frequency >= 0.4 && shouldHave.length < 20) {
      shouldHave.push(term);
    }
    // Nice to have: appears in 20-40% of results
    else if (frequency >= 0.2 && niceToHave.length < 25) {
      niceToHave.push(term);
    }
  });
  
  return { mustHave, shouldHave, niceToHave };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing or invalid auth token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify JWT using Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
    
    if (authError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get SERPER API key
    const serperApiKey = Deno.env.get("SERPER_API_KEY");
    if (!serperApiKey) {
      console.error("SERPER_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error - SERPER_API_KEY missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          details: validationResult.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { keyword, country, language, numResults } = validationResult.data;
    
    console.log(`Analyzing SERP for keyword: "${keyword}" in ${country}/${language}`);

    // Call Serper.dev API
    const serperResponse = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": serperApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: keyword,
        gl: country,
        hl: language,
        num: numResults,
      }),
    });

    if (!serperResponse.ok) {
      const errorText = await serperResponse.text();
      console.error("Serper API error:", errorText);
      return new Response(
        JSON.stringify({ error: "SERP API error", details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serperData = await serperResponse.json();
    console.log("Serper response received:", {
      organicCount: serperData.organic?.length || 0,
      paaCount: serperData.peopleAlsoAsk?.length || 0,
    });

    // Extract organic results
    const organicResults: SerpResult[] = (serperData.organic || []).map((result: any, index: number) => ({
      title: result.title || "",
      link: result.link || "",
      snippet: result.snippet || "",
      position: index + 1,
    }));

    // Extract People Also Ask
    const peopleAlsoAsk: PeopleAlsoAsk[] = (serperData.peopleAlsoAsk || []).map((paa: any) => ({
      question: paa.question || "",
      snippet: paa.snippet || "",
    }));

    // Extract competitor headlines
    const competitorHeadlines: string[] = organicResults
      .map(result => result.title)
      .filter(title => title.length > 0);

    // Analyze terms from titles and snippets
    const allTexts = organicResults.flatMap(result => [result.title, result.snippet]);
    const termCounts = extractTerms(allTexts);
    const termAnalysis = categorizeTerms(termCounts, organicResults.length);

    const response: AnalyzeSerpResponse = {
      keyword,
      termAnalysis,
      peopleAlsoAsk,
      competitorHeadlines,
      organicResults,
      totalResults: serperData.searchInformation?.totalResults,
    };

    console.log("Analysis complete:", {
      mustHaveCount: termAnalysis.mustHave.length,
      shouldHaveCount: termAnalysis.shouldHave.length,
      niceToHaveCount: termAnalysis.niceToHave.length,
      paaCount: peopleAlsoAsk.length,
      headlinesCount: competitorHeadlines.length,
    });

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in analyze-serp:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
