import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SearchFilterValues {
  dateRange: string;
  sourceType: string;
  category: string;
}

const DEFAULT_FILTERS: SearchFilterValues = {
  dateRange: "any",
  sourceType: "any",
  category: "any",
};

interface Props {
  filters: SearchFilterValues;
  onChange: (filters: SearchFilterValues) => void;
}

const DATE_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "day", label: "Past 24 hours" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "year", label: "Past year" },
];

const SOURCE_OPTIONS = [
  { value: "any", label: "All sources" },
  { value: "news", label: "News" },
  { value: "academic", label: "Academic" },
  { value: "official", label: "Official / Gov" },
  { value: "blog", label: "Blogs & Forums" },
];

const CATEGORY_OPTIONS = [
  { value: "any", label: "All topics" },
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "science", label: "Science" },
  { value: "health", label: "Health" },
  { value: "politics", label: "Politics" },
  { value: "entertainment", label: "Entertainment" },
];

export const SearchFilters = ({ filters, onChange }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = Object.values(filters).filter((v) => v !== "any").length;

  const handleReset = () => onChange(DEFAULT_FILTERS);

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-1.5"
      >
        <Filter className="h-3.5 w-3.5" />
        Filters
        {activeCount > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
            {activeCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="mt-3 bg-card border-border shadow-sm">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Search Filters</span>
                  <div className="flex items-center gap-2">
                    {activeCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs text-muted-foreground">
                        <X className="h-3 w-3 mr-1" /> Reset
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Date Range</label>
                    <Select value={filters.dateRange} onValueChange={(v) => onChange({ ...filters, dateRange: v })}>
                      <SelectTrigger className="text-sm h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Source Type</label>
                    <Select value={filters.sourceType} onValueChange={(v) => onChange({ ...filters, sourceType: v })}>
                      <SelectTrigger className="text-sm h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Category</label>
                    <Select value={filters.category} onValueChange={(v) => onChange({ ...filters, category: v })}>
                      <SelectTrigger className="text-sm h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { DEFAULT_FILTERS };
