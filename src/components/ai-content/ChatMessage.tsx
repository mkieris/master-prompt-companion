import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, User, Volume2, VolumeX, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isSpeaking?: boolean;
  onSpeak?: (text: string) => void;
  onOptionClick?: (option: string) => void;
}

const ChatMessage = ({ 
  role, 
  content, 
  isStreaming, 
  isSpeaking, 
  onSpeak,
  onOptionClick 
}: ChatMessageProps) => {
  // Parse content to separate text and options
  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const textLines: string[] = [];
    const options: string[] = [];
    
    lines.forEach(line => {
      if (line.trim().startsWith('•')) {
        options.push(line.substring(1).trim());
      } else {
        textLines.push(line);
      }
    });
    
    return { textLines, options };
  };

  const { textLines, options } = parseContent(content);
  const hasOptions = options.length > 0 && role === "assistant" && !isStreaming;

  const renderTextContent = (lines: string[]) => {
    return lines.map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      
      // Handle bold text
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="mb-1 last:mb-0">
          {parts.map((part, j) => 
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div
      className={cn(
        "flex gap-3",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {role === "assistant" && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
      
      <div className={cn("max-w-[80%] space-y-3", role === "user" && "order-first")}>
        <Card
          className={cn(
            "p-4",
            role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-card"
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {renderTextContent(textLines)}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
            )}
          </div>
          
          {role === "assistant" && !isStreaming && onSpeak && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-xs"
              onClick={() => onSpeak(content)}
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

        {/* Clickable Options */}
        {hasOptions && onOptionClick && (
          <div className="grid gap-2">
            {options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto py-3 px-4 text-left whitespace-normal hover:bg-primary/10 hover:border-primary transition-all"
                onClick={() => onOptionClick(option)}
              >
                <ArrowRight className="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
                <span>{option}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {role === "user" && (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
