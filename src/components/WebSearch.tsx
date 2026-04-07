import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ExternalLink, Globe, Clock, Sparkles, TrendingUp, BarChart3, Cpu, Lightbulb, Newspaper, History, X, Copy, Share2, Check, ArrowRight, Bookmark, BookmarkCheck, Columns2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import type { SearchResult, SavedSearch } from "./web-search/types";
import { useSearchStorage } from "./web-search/useSearchStorage";
import { SavedSearches } from "./web-search/SavedSearches";
import { ImageResults } from "./web-search/ImageResults";
import { ExportSavedSearches } from "./web-search/ExportSavedSearches";
import { PaginatedSources } from "./web-search/PaginatedSources";
import { CompareSearches } from "./web-search/CompareSearches";

const SUGGESTED_QUERIES = [
  { text: "Trending news today", icon: Newspaper, color: "text-red-400" },
  { text: "Market trends & analysis", icon: BarChart3, color: "text-green-400" },
  { text: "Latest tech updates", icon: Cpu, color: "text-blue-400" },
  { text: "Business insights 2026", icon: TrendingUp, color: "text-amber-400" },
  { text: "Did you know facts", icon: Lightbulb, color: "text-purple-400" },
];

export const WebSearch = () => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const { history, saved, saveToHistory, clearHistory, saveSearch, removeSaved, isSearchSaved } = useSearchStorage();

  const performSearch = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) { toast.error('Please enter a search query'); return; }
    setQuery(q);
    setIsSearching(true);
    setResult(null);
    setShowSaved(false);
    const startTime = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke('web-search', { body: { query: q } });
      if (error) throw error;
      setResult(data);
      setSearchTime(Date.now() - startTime);
      saveToHistory(q);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); performSearch(); }
  };

  const handleSaveSearch = () => {
    if (!result || !searchTime) return;
    const didSave = saveSearch(result.query, result, searchTime);
    toast.success(didSave ? "Search saved!" : "Already saved");
  };

  const handleLoadSaved = (item: SavedSearch) => {
    setResult(item.result);
    setSearchTime(item.searchTime);
    setQuery(item.query);
    setShowSaved(false);
  };

  const handleCopyAnswer = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      toast.success("Answer copied");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Failed to copy"); }
  };

  const handleShareResults = async () => {
    if (!result) return;
    const text = `${result.answer}\n\nSources:\n${result.sources.map(s => `[${s.id}] ${s.title} - ${s.url}`).join('\n')}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Search: ${result.query}`, text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Results copied for sharing");
    }
  };

  const getDomain = (url: string) => {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Search Input */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                AI-Powered Web Search
              </CardTitle>
              <CardDescription>Get comprehensive, cited answers powered by AI reasoning</CardDescription>
            </div>
            {saved.length > 0 && (
              <div className="flex items-center gap-2">
                <ExportSavedSearches saved={saved} />
                {saved.length >= 2 && (
                  <Button variant="outline" size="sm" onClick={() => { setShowCompare(!showCompare); setShowSaved(false); }} className="gap-1.5">
                    <Columns2 className="h-3.5 w-3.5" />
                    Compare
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => { setShowSaved(!showSaved); setShowCompare(false); }} className="gap-1.5">
                  <Bookmark className="h-3.5 w-3.5" />
                  Saved ({saved.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Ask anything — news, research, trends, facts..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} className="pl-10 bg-background h-11 text-base" />
            </div>
            <Button onClick={() => performSearch()} disabled={isSearching || !query.trim()} size="lg" className="px-6">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {!result && !isSearching && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((item, i) => (
                <motion.button key={item.text} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => performSearch(item.text)} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:bg-accent/50 transition-all text-sm">
                  <item.icon className={`w-3.5 h-3.5 ${item.color} group-hover:text-primary transition-colors`} />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">{item.text}</span>
                </motion.button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Searches Panel */}
      {showSaved && !isSearching && <SavedSearches saved={saved} onLoad={handleLoadSaved} onRemove={removeSaved} />}

      {/* Compare View */}
      {showCompare && !isSearching && saved.length >= 2 && <CompareSearches saved={saved} onClose={() => setShowCompare(false)} />}

      {/* Search History */}
      {!result && !isSearching && !showSaved && history.length > 0 && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                <History className="h-4 w-4" /> Recent Searches
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { clearHistory(); toast.success("History cleared"); }} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {history.map((item, i) => (
                <motion.button key={`${item.query}-${item.timestamp}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} onClick={() => performSearch(item.query)} className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 hover:border-primary/40 hover:bg-accent/50 transition-all text-sm">
                  <Clock className="w-3 h-3 text-muted-foreground/60" />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[200px]">{item.query}</span>
                  <span className="text-[10px] text-muted-foreground/50">{timeAgo(item.timestamp)}</span>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isSearching && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-muted animate-spin border-t-primary" />
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
          <div className="flex items-center gap-4 text-sm text-muted-foreground px-1">
            <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Results for: <span className="font-medium text-foreground">{result.query}</span></span>
            {searchTime && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{(searchTime / 1000).toFixed(1)}s</span>}
            {result.sources.length > 0 && <span>{result.sources.length} source{result.sources.length !== 1 ? 's' : ''} cited</span>}
          </div>

          {/* Answer */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-table:text-sm prose-th:bg-muted/50 prose-th:p-2 prose-td:p-2 prose-tr:border-border">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.answer}</ReactMarkdown>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={handleCopyAnswer} className="gap-1.5">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy answer"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShareResults} className="gap-1.5">
                  <Share2 className="h-3.5 w-3.5" /> Share results
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveSearch} className="gap-1.5" disabled={isSearchSaved(result.query)}>
                  {isSearchSaved(result.query) ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
                  {isSearchSaved(result.query) ? "Saved" : "Save search"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Image Results */}
          {result.images && result.images.length > 0 && <ImageResults images={result.images} />}

          {/* Sources */}
          {result.sources.length > 0 && (
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" /> Sources ({result.sources.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {result.sources.map((source) => (
                    <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{source.id}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">{source.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{getDomain(source.url)}</p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1 transition-colors" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Follow-Up Questions */}
          {result.followUps && result.followUps.length > 0 && (
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> Explore further
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-2">
                  {result.followUps.map((q, i) => (
                    <motion.button key={q} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} onClick={() => performSearch(q)} className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-left">
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors" />
                      <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{q}</span>
                    </motion.button>
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
