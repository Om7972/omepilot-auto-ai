import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Newspaper, History, TrendingUp, BookOpen, Briefcase, Loader2, Bookmark, Clock, RefreshCw, Share2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categories = [
  { id: 'news', label: 'Latest News', icon: Newspaper, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { id: 'history', label: 'History Today', icon: History, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'business', label: 'Business Insights', icon: Briefcase, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'knowledge', label: 'Did You Know', icon: BookOpen, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { id: 'trends', label: 'Market Trends', icon: TrendingUp, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
];

interface DiscoverHistory {
  category: string;
  content: string;
  timestamp: string;
  bookmarked: boolean;
}

export const DiscoverPanel = () => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [history, setHistory] = useState<DiscoverHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem('discoverHistory');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  };

  const saveToHistory = (category: string, content: string) => {
    const newEntry: DiscoverHistory = {
      category,
      content,
      timestamp: new Date().toISOString(),
      bookmarked: false
    };
    const updated = [newEntry, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('discoverHistory', JSON.stringify(updated));
  };

  const toggleBookmark = (index: number) => {
    const updated = [...history];
    updated[index].bookmarked = !updated[index].bookmarked;
    setHistory(updated);
    localStorage.setItem('discoverHistory', JSON.stringify(updated));
    toast.success(updated[index].bookmarked ? 'Bookmarked' : 'Removed bookmark');
  };

  const handleDiscover = async (category: string) => {
    setIsLoading(true);
    setSelectedCategory(category);
    setShowHistory(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('discover', {
        body: { category }
      });

      if (error) throw error;

      if (data.success) {
        setContent(data.content);
        saveToHistory(category, data.content);
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

  const shareContent = () => {
    if (navigator.share) {
      navigator.share({
        title: `Discover: ${selectedCategory}`,
        text: content,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover</h1>
          <p className="text-muted-foreground">AI-powered content discovery across various topics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            title={showHistory ? "Show Discover" : "Show History"}
          >
            {showHistory ? <RefreshCw className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          </Button>
          {content && !showHistory && (
            <Button
              variant="outline"
              size="icon"
              onClick={shareContent}
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!showHistory && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              onClick={() => handleDiscover(cat.id)}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className={`h-auto flex-col gap-2 p-4 ${selectedCategory === cat.id ? '' : cat.color}`}
              disabled={isLoading}
            >
              <cat.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{cat.label}</span>
            </Button>
          ))}
        </div>
      )}

      <ScrollArea className="flex-1 rounded-lg border border-border">
        {showHistory ? (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Discovery History</h2>
              <Badge variant="secondary">{history.length} items</Badge>
            </div>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mb-3 opacity-50" />
                <p>No history yet. Start discovering!</p>
              </div>
            ) : (
              history.map((item, index) => (
                <Card key={index} className="bg-card hover:bg-accent/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={categories.find(c => c.id === item.category)?.color}>
                          {categories.find(c => c.id === item.category)?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleBookmark(index)}
                        className="h-8 w-8"
                      >
                        <Bookmark className={`h-4 w-4 ${item.bookmarked ? 'fill-current text-yellow-500' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{item.content}</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 p-0 h-auto"
                      onClick={() => {
                        setContent(item.content);
                        setSelectedCategory(item.category);
                        setShowHistory(false);
                      }}
                    >
                      View full content
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Discovering amazing content...</p>
          </div>
        ) : content ? (
          <Card className="p-6 bg-card border-0">
            <div className="mb-4 flex items-center justify-between">
              <Badge variant="outline" className={categories.find(c => c.id === selectedCategory)?.color}>
                {categories.find(c => c.id === selectedCategory)?.label}
              </Badge>
            </div>
            <Separator className="mb-6" />
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">{content}</div>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Sparkles className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg font-medium">Select a category to discover content</p>
            <p className="text-sm mt-2">AI-powered insights updated in real-time</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
