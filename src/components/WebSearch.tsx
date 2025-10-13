import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const WebSearch = () => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const performSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('web-search', {
        body: { query }
      });

      if (error) throw error;

      setResult(data);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      performSearch();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6 text-primary" />
            AI-Powered Web Search
          </CardTitle>
          <CardDescription>Search with AI reasoning and citations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background"
            />
            <Button
              onClick={performSearch}
              disabled={isSearching || !query.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Results for: {result.query}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-foreground">
                {result.answer}
              </div>
            </div>

            {result.sources && result.sources.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Sources
                </h3>
                <div className="space-y-2">
                  {result.sources.map((source: any, index: number) => (
                    <div
                      key={index}
                      className="text-sm flex items-center gap-2 text-muted-foreground"
                    >
                      <span className="font-mono text-primary">{source.citation}</span>
                      <a
                        href={source.url}
                        className="hover:text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {source.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};