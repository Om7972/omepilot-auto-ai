import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Newspaper, History, TrendingUp, BookOpen, Briefcase, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categories = [
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'history', label: 'History', icon: History },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'trends', label: 'Market Trends', icon: TrendingUp },
];

export const DiscoverPanel = () => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleDiscover = async (category: string) => {
    setIsLoading(true);
    setSelectedCategory(category);
    
    try {
      const { data, error } = await supabase.functions.invoke('discover', {
        body: { category }
      });

      if (error) throw error;

      if (data.success) {
        setContent(data.content);
      } else {
        toast.error('Failed to fetch content');
      }
    } catch (error) {
      console.error('Discover error:', error);
      toast.error('Failed to fetch discover content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Discover</h1>
        <p className="text-muted-foreground">Explore interesting content across various topics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            onClick={() => handleDiscover(cat.id)}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            className="h-auto flex-col gap-2 p-4"
            disabled={isLoading}
          >
            <cat.icon className="h-6 w-6" />
            <span className="text-sm">{cat.label}</span>
          </Button>
        ))}
      </div>

      <ScrollArea className="flex-1 rounded-lg border border-border">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : content ? (
          <Card className="p-6 bg-card border-0">
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-card-foreground">{content}</div>
            </div>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a category to discover content
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
