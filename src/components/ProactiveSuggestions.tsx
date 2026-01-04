import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lightbulb, X, Sparkles, TrendingUp, Clock, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProactiveSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

interface Suggestion {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const TIME_BASED_SUGGESTIONS: Record<string, Suggestion[]> = {
  morning: [
    { text: "Plan my day and prioritize tasks", icon: Target, category: "productivity" },
    { text: "Give me a motivational quote to start the day", icon: Sparkles, category: "inspiration" },
    { text: "What's trending in tech news today?", icon: TrendingUp, category: "news" },
  ],
  afternoon: [
    { text: "Help me brainstorm ideas for my project", icon: Lightbulb, category: "creativity" },
    { text: "Summarize what I've worked on today", icon: Clock, category: "productivity" },
    { text: "Suggest ways to improve my workflow", icon: TrendingUp, category: "productivity" },
  ],
  evening: [
    { text: "Help me learn something new tonight", icon: Sparkles, category: "learning" },
    { text: "Suggest a creative writing prompt", icon: Lightbulb, category: "creativity" },
    { text: "Review and plan for tomorrow", icon: Target, category: "productivity" },
  ],
};

const PERSONALIZED_SUGGESTIONS: Suggestion[] = [
  { text: "Continue our last conversation", icon: Clock, category: "context" },
  { text: "Show me my recent memories", icon: Sparkles, category: "memory" },
  { text: "Help me improve based on my usage patterns", icon: TrendingUp, category: "growth" },
];

export const ProactiveSuggestions = ({ onSuggestionClick, className }: ProactiveSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [recentTopics, setRecentTopics] = useState<string[]>([]);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    // Determine time of day
    const hour = new Date().getHours();
    let timeOfDay = "morning";
    if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17) timeOfDay = "evening";

    // Get base time-based suggestions
    const baseSuggestions = TIME_BASED_SUGGESTIONS[timeOfDay] || TIME_BASED_SUGGESTIONS.morning;

    // Load recent conversation topics for personalization
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: recentConvos } = await supabase
          .from("conversations")
          .select("title")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(3);

        if (recentConvos && recentConvos.length > 0) {
          setRecentTopics(recentConvos.map(c => c.title));
        }
      }
    } catch (error) {
      console.error("Error loading recent topics:", error);
    }

    // Combine suggestions
    const allSuggestions = [...baseSuggestions, ...PERSONALIZED_SUGGESTIONS.slice(0, 2)];
    setSuggestions(allSuggestions.slice(0, 4));
  };

  if (dismissed || suggestions.length === 0) return null;

  return (
    <Card className={cn("p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Suggestions for you</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 -mt-1 -mr-1"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="justify-start h-auto py-2 px-3 text-left text-sm font-normal hover:bg-primary/10 hover:border-primary/30"
            onClick={() => onSuggestionClick(suggestion.text)}
          >
            <suggestion.icon className="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
            <span className="truncate">{suggestion.text}</span>
          </Button>
        ))}
      </div>
      {recentTopics.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Continue recent topics:</p>
          <div className="flex flex-wrap gap-1">
            {recentTopics.map((topic, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onSuggestionClick(`Tell me more about: ${topic}`)}
              >
                {topic.length > 25 ? topic.substring(0, 25) + "..." : topic}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
