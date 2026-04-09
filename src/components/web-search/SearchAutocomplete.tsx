import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  query: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  history: { query: string; timestamp: number }[];
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const POPULAR_SUGGESTIONS = [
  "What is artificial intelligence?",
  "Climate change latest research",
  "Stock market trends today",
  "Best programming languages 2026",
  "Space exploration news",
  "Quantum computing explained",
  "Healthy eating tips",
  "Renewable energy advances",
];

export const SearchAutocomplete = ({ query, onChange, onSearch, onKeyDown, history, disabled, inputRef: externalRef }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || internalRef;

  const getSuggestions = useCallback(() => {
    const q = query.trim().toLowerCase();
    const items: { text: string; type: "history" | "suggestion" }[] = [];

    if (q.length === 0) {
      history.slice(0, 3).forEach((h) => items.push({ text: h.query, type: "history" }));
      POPULAR_SUGGESTIONS.slice(0, 4).forEach((s) => items.push({ text: s, type: "suggestion" }));
      return items;
    }

    history
      .filter((h) => h.query.toLowerCase().includes(q) && h.query.toLowerCase() !== q)
      .slice(0, 3)
      .forEach((h) => items.push({ text: h.query, type: "history" }));

    POPULAR_SUGGESTIONS
      .filter((s) => s.toLowerCase().includes(q) && !items.some((i) => i.text.toLowerCase() === s.toLowerCase()))
      .slice(0, 4 - items.length)
      .forEach((s) => items.push({ text: s, type: "suggestion" }));

    return items;
  }, [query, history]);

  const suggestions = getSuggestions();

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDownInternal = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      onKeyDown(e);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];
      onChange(selected.text);
      onSearch(selected.text);
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else {
      onKeyDown(e);
    }
  };

  const handleSelect = (text: string) => {
    onChange(text);
    onSearch(text);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Ask anything — news, research, trends, facts..."
        value={query}
        onChange={(e) => { onChange(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDownInternal}
        disabled={disabled}
        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
          >
            {suggestions.map((item, i) => (
              <button
                key={`${item.type}-${item.text}`}
                onClick={() => handleSelect(item.text)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors",
                  selectedIndex === i
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 text-foreground/80"
                )}
              >
                {item.type === "history" ? (
                  <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
                <span className="truncate">{item.text}</span>
                <span className="ml-auto text-[10px] text-muted-foreground/60 flex-shrink-0">
                  {item.type === "history" ? "Recent" : "Popular"}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
