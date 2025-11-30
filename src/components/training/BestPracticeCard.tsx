import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface BestPracticeCardProps {
  title: string;
  dos: string[];
  donts: string[];
  proTip?: string;
}

export const BestPracticeCard = ({ title, dos, donts, proTip }: BestPracticeCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <span className="font-semibold">{title}</span>
          <Badge variant="outline" className="ml-auto text-xs">Best Practice</Badge>
        </div>
      </div>
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Do's */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">Do's</span>
            </div>
            <ul className="space-y-2">
              {dos.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Don'ts */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Don'ts</span>
            </div>
            <ul className="space-y-2">
              {donts.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500 shrink-0">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {proTip && (
          <div className="px-4 py-3 bg-amber-500/10 border-t flex items-start gap-2">
            <span className="text-amber-500 shrink-0">💡</span>
            <p className="text-sm text-amber-800">
              <strong>Pro-Tipp:</strong> {proTip}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
