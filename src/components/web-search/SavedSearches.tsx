import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, X, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { SavedSearch } from "./types";

interface Props {
  saved: SavedSearch[];
  onLoad: (item: SavedSearch) => void;
  onRemove: (id: string) => void;
}

export const SavedSearches = ({ saved, onLoad, onRemove }: Props) => {
  if (saved.length === 0) return null;

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
          <Bookmark className="h-4 w-4 text-primary" />
          Saved Searches ({saved.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-2">
          {saved.slice(0, 5).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/50 transition-all"
            >
              <button onClick={() => onLoad(item)} className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.query}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(item.savedAt)} · {item.result.sources.length} sources
                </p>
              </button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onLoad(item)}>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(item.id)}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
