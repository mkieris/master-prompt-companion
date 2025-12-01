import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Star, Sparkles, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContentRatingProps {
  projectId: string;
  promptVersion: string;
  formData: any;
  generatedContent: any;
}

const feedbackCategories = [
  { id: 'seo-quality', label: 'SEO-Qualität' },
  { id: 'readability', label: 'Lesbarkeit' },
  { id: 'tone', label: 'Tonalität passt' },
  { id: 'structure', label: 'Struktur' },
  { id: 'keyword-integration', label: 'Keyword-Integration' },
  { id: 'creativity', label: 'Kreativität' },
  { id: 'accuracy', label: 'Fachliche Korrektheit' },
];

export function ContentRating({ projectId, promptVersion, formData, generatedContent }: ContentRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const { toast } = useToast();

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast({
        title: "Bewertung erforderlich",
        description: "Bitte wählen Sie eine Sterne-Bewertung aus",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_organization_id')
        .eq('id', user?.id)
        .single();

      if (!user || !profile?.current_organization_id) {
        throw new Error('User or organization not found');
      }

      const { error } = await supabase
        .from('content_ratings')
        .insert({
          project_id: projectId,
          organization_id: profile.current_organization_id,
          rated_by: user.id,
          rating: rating,
          feedback_text: feedbackText || null,
          feedback_categories: selectedCategories,
          prompt_version: promptVersion,
          form_data: formData,
          generated_content: generatedContent
        });

      if (error) throw error;

      setHasRated(true);

      toast({
        title: "✅ Bewertung gespeichert",
        description: "Vielen Dank! Ihre Bewertung hilft uns, das Tool zu verbessern.",
      });

      // Trigger insight generation for admins (async, fire-and-forget)
      if (rating <= 3) {
        supabase.functions.invoke('generate-insights', {
          body: { organizationId: profile.current_organization_id }
        }).catch(err => console.error('Insight generation failed:', err));
      }

    } catch (error) {
      console.error('Rating submission error:', error);
      toast({
        title: "Fehler",
        description: "Bewertung konnte nicht gespeichert werden",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasRated) {
    return (
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <ThumbsUp className="h-6 w-6 text-green-600" />
          <div>
            <h4 className="font-semibold text-green-900 dark:text-green-100">Bewertung abgegeben</h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Danke für Ihr Feedback! Das Tool lernt aus Ihren Bewertungen.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Bewerten Sie diesen Content</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Ihre Bewertung hilft unserem KI-System zu lernen und bessere Inhalte zu generieren.
        </p>

        {/* Star Rating */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Qualität:</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              {rating === 1 && "Schlecht"}
              {rating === 2 && "Verbesserungswürdig"}
              {rating === 3 && "Akzeptabel"}
              {rating === 4 && "Gut"}
              {rating === 5 && "Exzellent"}
            </span>
          )}
        </div>

        {/* Feedback Categories */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Was hat besonders gut funktioniert?</Label>
          <div className="grid grid-cols-2 gap-3">
            {feedbackCategories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories([...selectedCategories, category.id]);
                    } else {
                      setSelectedCategories(selectedCategories.filter(c => c !== category.id));
                    }
                  }}
                />
                <Label
                  htmlFor={category.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {category.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Text */}
        <div className="space-y-2">
          <Label htmlFor="feedback">Detailliertes Feedback (optional)</Label>
          <Textarea
            id="feedback"
            placeholder="Was könnte verbessert werden? Welche Aspekte waren besonders gut?"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmitRating}
          disabled={isSubmitting || rating === 0}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Wird gespeichert...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Bewertung absenden
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
