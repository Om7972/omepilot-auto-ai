import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ExternalLink, Globe, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Source {
  id: number;
  title: string;
  url: string;
}

interface SearchResult {
  answer: string;
  sources: Source[];
  query: string;
}

export const WebSearch = () => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);

  const performSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setResult(null);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('web-search', {
        body: { query }
      });

      if (error) throw error;

      setResult(data);
      setSearchTime(Date.now() - startTime);
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

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Search Input */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            AI-Powered Web Search
          </CardTitle>
          <CardDescription>Get comprehensive, cited answers powered by AI reasoning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ask anything — news, research, trends, facts..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 bg-background h-11 text-base"
              />
            </div>
            <Button
              onClick={performSearch}
              disabled={isSearching || !query.trim()}
              size="lg"
              className="px-6"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isSearching && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-muted animate-spin border-t-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Researching your query...</p>
              <p className="text-sm text-muted-foreground mt-1">Analyzing sources and composing answer</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !isSearching && (
        <div className="space-y-4">
          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              Results for: <span className="font-medium text-foreground">{result.query}</span>
            </span>
            {searchTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {(searchTime / 1000).toFixed(1)}s
              </span>
            )}
            {result.sources.length > 0 && (
              <span>{result.sources.length} source{result.sources.length !== 1 ? 's' : ''} cited</span>
            )}
          </div>

          {/* Answer Card */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-table:text-sm prose-th:bg-muted/50 prose-th:p-2 prose-td:p-2 prose-tr:border-border">
                <ReactMarkdown>{result.answer}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Sources Card */}
          {result.sources && result.sources.length > 0 && (
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  Sources ({result.sources.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {result.sources.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                        {source.id}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {source.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {getDomain(source.url)}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
