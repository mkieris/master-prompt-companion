import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Bot } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useOrganization } from "@/hooks/useOrganization";
import ChatMessage from "@/components/ai-content/ChatMessage";
import ChatInput from "@/components/ai-content/ChatInput";
import StepIndicator from "@/components/ai-content/StepIndicator";
import ExtractedDataSummary from "@/components/ai-content/ExtractedDataSummary";

interface AIContentCreatorProps {
  session: Session | null;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  step?: string;
  isStreaming?: boolean;
}

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

const STEPS = [
  { id: "intro", label: "Begrüßung" },
  { id: "pageType", label: "Seitentyp" },
  { id: "keyword", label: "Keywords" },
  { id: "audience", label: "Zielgruppe" },
  { id: "content", label: "Inhalte" },
  { id: "style", label: "Stil & Ton" },
  { id: "generate", label: "Generierung" },
];

const AIContentCreator = ({ session }: AIContentCreatorProps) => {
  const { toast } = useToast();
  const { currentOrg } = useOrganization(session);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [domainKnowledge, setDomainKnowledge] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (currentOrg) {
      loadDomainKnowledge();
    }
  }, [currentOrg]);

  useEffect(() => {
    if (currentOrg && messages.length === 0) {
      startConversation();
    }
  }, [currentOrg, domainKnowledge]);

  const loadDomainKnowledge = async () => {
    if (!currentOrg) return;
    
    const { data } = await supabase
      .from('domain_knowledge')
      .select('*')
      .eq('organization_id', currentOrg.id)
      .eq('crawl_status', 'completed')
      .maybeSingle();
    
    if (data) {
      setDomainKnowledge(data);
    }
  };

  const startConversation = async () => {
    const companyName = domainKnowledge?.company_name || currentOrg?.name;
    const welcomeMessage = domainKnowledge 
      ? `Hallo! 👋 Ich bin dein **KI-Content-Assistent** und führe dich durch die professionelle SEO-Content-Erstellung.\n\nIch habe bereits Wissen über **${companyName}** geladen und werde dieses nutzen, um personalisierte Vorschläge zu machen.\n\n**Was wir gemeinsam definieren werden:**\n• Seitentyp & Keywords\n• Zielgruppe & Ansprache\n• Tonalität & Textstruktur\n• USPs & Call-to-Actions\n\n**Welche Art von Seite möchtest du erstellen?**\n\n• Produktseite\n• Kategorieseite\n• Ratgeber / Blog\n• Landingpage`
      : `Hallo! 👋 Ich bin dein **KI-Content-Assistent** und führe dich durch die professionelle SEO-Content-Erstellung.\n\n**Was wir gemeinsam definieren werden:**\n• Seitentyp & Keywords\n• Zielgruppe & Ansprache (Du/Sie, B2B/B2C)\n• Tonalität (Experten-Mix, Storytelling-Mix, etc.)\n• Textstruktur & Länge\n• USPs & Call-to-Actions\n\n**Welche Art von Seite möchtest du erstellen?**\n\n• Produktseite\n• Kategorieseite\n• Ratgeber / Blog\n• Landingpage`;

    addMessage("assistant", welcomeMessage, "pageType");
    setCurrentStep(1);
  };

  const addMessage = (role: "user" | "assistant", content: string, step?: string) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      step,
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const updateLastAssistantMessage = (content: string) => {
    setMessages(prev => {
      const lastIndex = prev.length - 1;
      if (prev[lastIndex]?.role === "assistant") {
        return prev.map((msg, i) => 
          i === lastIndex ? { ...msg, content, isStreaming: false } : msg
        );
      }
      return prev;
    });
  };

  const handleOptionClick = (option: string) => {
    if (isLoading) return;
    sendMessageWithText(option);
  };

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    setInputValue("");
    addMessage("user", userMessage);
    setIsLoading(true);

    const streamingMsg = addMessage("assistant", "", undefined);
    setMessages(prev => prev.map(msg => 
      msg.id === streamingMsg.id ? { ...msg, isStreaming: true } : msg
    ));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-content-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            userMessage,
            currentStep: STEPS[currentStep]?.id,
            extractedData,
            domainKnowledge: domainKnowledge ? {
              companyName: domainKnowledge.company_name,
              industry: domainKnowledge.industry,
              targetAudience: domainKnowledge.target_audience,
              products: domainKnowledge.main_products_services,
              usps: domainKnowledge.unique_selling_points,
              brandVoice: domainKnowledge.brand_voice,
              keywords: domainKnowledge.keywords,
            } : null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.extractedData) {
                  setExtractedData(prev => ({ ...prev, ...parsed.extractedData }));
                }
                
                if (parsed.nextStep !== undefined) {
                  setCurrentStep(parsed.nextStep);
                }
                
                if (parsed.content) {
                  fullContent += parsed.content;
                  updateLastAssistantMessage(fullContent);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }

    } catch (error) {
      console.error("Error:", error);
      updateLastAssistantMessage("Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.");
      toast({
        title: "Fehler",
        description: "Die KI-Antwort konnte nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => {
    sendMessageWithText(inputValue);
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Nicht unterstützt",
        description: "Spracherkennung wird von deinem Browser nicht unterstützt.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'de-DE';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputValue(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  };

  const speakMessage = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#•]/g, ''));
    utterance.lang = 'de-DE';
    utterance.rate = 1.0;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  if (!session) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">KI Content Creator</h1>
              <p className="text-sm text-muted-foreground">Interaktive SEO-Content Erstellung</p>
            </div>
          </div>
        </div>

        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              isStreaming={message.isStreaming}
              isSpeaking={isSpeaking}
              onSpeak={speakMessage}
              onOptionClick={handleOptionClick}
            />
          ))}
          
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Denke nach...</span>
                </div>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <ExtractedDataSummary data={extractedData} />

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={sendMessage}
        onToggleListening={toggleListening}
        isListening={isListening}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AIContentCreator;