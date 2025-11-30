import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onToggleListening: () => void;
  isListening: boolean;
  isLoading: boolean;
}

const ChatInput = ({
  value,
  onChange,
  onSend,
  onToggleListening,
  isListening,
  isLoading,
}: ChatInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t bg-card p-4">
      <div className="max-w-3xl mx-auto flex gap-2">
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          onClick={onToggleListening}
          className="flex-shrink-0"
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
        
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isListening ? "Ich höre zu..." : "Schreibe deine Antwort oder wähle eine Option..."}
          disabled={isLoading}
          className={cn(
            "flex-1",
            isListening && "border-destructive animate-pulse"
          )}
        />
        
        <Button
          onClick={onSend}
          disabled={!value.trim() || isLoading}
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
        Klicke auf eine Option oder gib deine eigene Antwort ein
      </p>
    </div>
  );
};

export default ChatInput;
