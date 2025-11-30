import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Loader2,
  Bot,
  User,
  Volume2,
  VolumeX,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useOrganization } from "@/hooks/useOrganization";
import { cn } from "@/lib/utils";

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
  tonality?: string;
  companyInfo?: string;
  productInfo?: string;
  usps?: string[];
  searchIntent?: string[];
  wQuestions?: string[];
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load domain knowledge
  useEffect(() => {
    if (currentOrg) {
      loadDomainKnowledge();
    }
  }, [currentOrg]);

  // Initialize conversation
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
    const welcomeMessage = domainKnowledge 
      ? `Hallo! 👋 Ich bin dein KI-Assistent für SEO-Content. Ich habe bereits Wissen über **${domainKnowledge.company_name || currentOrg?.name}** geladen.\n\nIch werde dich interaktiv durch den Content-Erstellungsprozess führen. Du kannst mir jederzeit per Text oder Sprache antworten.\n\n**Lass uns starten:** Welche Art von Seite möchtest du erstellen?\n\n• Produktseite\n• Kategorieseite\n• Ratgeber / Blog\n• Landingpage`
      : `Hallo! 👋 Ich bin dein KI-Assistent für SEO-Content.\n\nIch werde dich interaktiv durch den Content-Erstellungsprozess führen. Du kannst mir jederzeit per Text oder Sprache antworten.\n\n**Lass uns starten:** Welche Art von Seite möchtest du erstellen?\n\n• Produktseite\n• Kategorieseite\n• Ratgeber / Blog\n• Landingpage`;

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

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    addMessage("user", userMessage);
    setIsLoading(true);

    // Add streaming placeholder
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

      // Handle streaming response
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
                
                // Handle extracted data
                if (parsed.extractedData) {
                  setExtractedData(prev => ({ ...prev, ...parsed.extractedData }));
                }
                
                // Handle step change
                if (parsed.nextStep !== undefined) {
                  setCurrentStep(parsed.nextStep);
                }
                
                // Handle content
                if (parsed.content) {
                  fullContent += parsed.content;
                  updateLastAssistantMessage(fullContent);
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
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

  // Voice input handling
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

  // Text-to-speech
  const speakMessage = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
    utterance.lang = 'de-DE';
    utterance.rate = 1.0;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!session) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header with Steps */}
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

        {/* Step Indicator */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                index < currentStep
                  ? "bg-primary/20 text-primary"
                  : index === currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index < currentStep ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <span className="w-4 text-center">{index + 1}</span>
              )}
              {step.label}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              
              <Card
                className={cn(
                  "max-w-[80%] p-4",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                )}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0">
                      {line.startsWith('•') ? (
                        <span className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {line.substring(1).trim()}
                        </span>
                      ) : (
                        line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .split(/<strong>|<\/strong>/)
                          .map((part, j) => 
                            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                          )
                      )}
                    </p>
                  ))}
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  )}
                </div>
                
                {message.role === "assistant" && !message.isStreaming && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => speakMessage(message.content)}
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-3 w-3 mr-1" />
                    ) : (
                      <Volume2 className="h-3 w-3 mr-1" />
                    )}
                    {isSpeaking ? "Stopp" : "Vorlesen"}
                  </Button>
                )}
              </Card>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
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

      {/* Extracted Data Summary */}
      {Object.keys(extractedData).length > 0 && (
        <div className="border-t bg-muted/50 p-3">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-muted-foreground mb-2">Erfasste Daten:</p>
            <div className="flex flex-wrap gap-2">
              {extractedData.pageType && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {extractedData.pageType}
                </span>
              )}
              {extractedData.focusKeyword && (
                <span className="text-xs bg-accent/10 text-accent-foreground px-2 py-1 rounded-full">
                  🎯 {extractedData.focusKeyword}
                </span>
              )}
              {extractedData.audienceType && (
                <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-1 rounded-full">
                  👥 {extractedData.audienceType}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-card p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Button
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={toggleListening}
            className="flex-shrink-0"
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Ich höre zu..." : "Schreibe deine Antwort..."}
            disabled={isLoading}
            className={cn(
              "flex-1",
              isListening && "border-destructive animate-pulse"
            )}
          />
          
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          Drücke Enter zum Senden oder nutze das Mikrofon für Spracheingabe
        </p>
      </div>
    </div>
  );
};

export default AIContentCreator;