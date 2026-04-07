import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Columns2, ExternalLink, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SavedSearch } from "./types";

interface Props {
  saved: SavedSearch[];
  onClose: () => void;
}

export const CompareSearches = ({ saved, onClose }: Props) => {
  const [leftId, setLeftId] = useState<string>(saved[0]?.id ?? "");
  const [rightId, setRightId] = useState<string>(saved[1]?.id ?? "");

  const left = saved.find((s) => s.id === leftId);
  const right = saved.find((s) => s.id === rightId);

  const getDomain = (url: string) => {
    try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
  };

  const SearchPanel = ({ item }: { item?: SavedSearch }) => {
    if (!item) return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 border border-dashed border-border rounded-lg">
        Select a saved search
      </div>
    );
    return (
      <div className="flex-1 min-w-0 space-y-3">
        <div className="font-semibold text-foreground text-sm truncate">{item.query}</div>
        <div className="text-xs text-muted-foreground">
          {item.result.sources.length} sources · {(item.searchTime / 1000).toFixed(1)}s
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground/90 prose-headings:text-foreground text-xs max-h-[400px] overflow-y-auto border border-border rounded-lg p-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.result.answer}</ReactMarkdown>
        </div>
        {item.result.sources.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Sources</p>
            {item.result.sources.slice(0, 5).map((src) => (
              <a
                key={src.id}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-foreground/70 hover:text-primary transition-colors"
              >
                <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {src.id}
                </span>
                <span className="truncate">{src.title}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
            ))}
            {item.result.sources.length > 5 && (
              <p className="text-[10px] text-muted-foreground">+{item.result.sources.length - 5} more</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Columns2 className="h-4 w-4 text-primary" /> Compare Searches
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select value={leftId} onValueChange={setLeftId}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select search..." />
            </SelectTrigger>
            <SelectContent>
              {saved.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.query}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rightId} onValueChange={setRightId}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select search..." />
            </SelectTrigger>
            <SelectContent>
              {saved.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.query}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SearchPanel item={left} />
          <SearchPanel item={right} />
        </div>
      </CardContent>
    </Card>
  );
};
