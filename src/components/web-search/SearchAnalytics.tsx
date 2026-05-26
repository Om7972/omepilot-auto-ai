import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, Search, Hash, Zap, Cloud, Trash2, Download, X, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Table as TableIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import type { SearchHistoryItem, SavedSearch } from "./types";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Props {
  history: SearchHistoryItem[];
  saved: SavedSearch[];
  onClear?: () => void;
}

const STOP_WORDS = new Set(["the","a","an","and","or","of","to","in","for","on","with","is","are","what","how","why","when","where","who","which","by","at","from","as","be","do","does","this","that","i","my","your","it","its","about","vs","best","top"]);

type RangeKey = "7" | "30" | "90" | "all";
const RANGE_LABELS: Record<RangeKey, string> = { "7": "7 days", "30": "30 days", "90": "90 days", "all": "All time" };

function csvEscape(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const FILTERS_KEY = "web-search-analytics-filters";
type SortKey = "timestamp" | "query" | "duration";
type SortDir = "asc" | "desc";

export const SearchAnalytics = ({ history, saved, onClear }: Props) => {
  const [range, setRange] = useState<RangeKey>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(FILTERS_KEY) || "{}");
      return (["7", "30", "90", "all"].includes(v.range) ? v.range : "7") as RangeKey;
    } catch { return "7"; }
  });
  const [wordFilter, setWordFilter] = useState<string | null>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(FILTERS_KEY) || "{}");
      return typeof v.wordFilter === "string" ? v.wordFilter : null;
    } catch { return null; }
  });
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify({ range, wordFilter }));
  }, [range, wordFilter]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [range, wordFilter, sortKey, sortDir]);

  const stats = useMemo(() => {
    const all = [
      ...history.map((h) => ({ query: h.query, timestamp: h.timestamp })),
      ...saved.map((s) => ({ query: s.query, timestamp: s.savedAt })),
    ];
    const unique = all.filter(
      (item, i, arr) => arr.findIndex((x) => x.query === item.query && x.timestamp === item.timestamp) === i
    );

    // Apply date range
    const now = Date.now();
    const dayMs = 86400000;
    const rangeDays = range === "all" ? Infinity : parseInt(range, 10);
    const cutoff = range === "all" ? 0 : now - rangeDays * dayMs;
    const inRange = unique.filter((s) => s.timestamp >= cutoff);
    const savedInRange = saved.filter((s) => s.savedAt >= cutoff);

    // Apply word filter
    const wf = wordFilter?.toLowerCase();
    const filtered = wf ? inRange.filter((s) => s.query.toLowerCase().includes(wf)) : inRange;

    // Duration lookup (from saved entries) keyed by query
    const durationByQuery = new Map<string, number>();
    saved.forEach((s) => {
      if (!durationByQuery.has(s.query)) durationByQuery.set(s.query, s.searchTime);
    });
    const tableRows = filtered.map((s) => ({
      query: s.query,
      timestamp: s.timestamp,
      duration: durationByQuery.get(s.query) ?? null,
    }));

    // Popular queries
    const queryCounts: Record<string, number> = {};
    filtered.forEach((s) => {
      const q = s.query.toLowerCase().trim();
      queryCounts[q] = (queryCounts[q] || 0) + 1;
    });
    const popularQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([query, count]) => ({ query, count }));

    // Daily trend buckets
    const buckets = range === "all" ? 14 : Math.min(rangeDays, 30);
    const dailyTrend = Array.from({ length: buckets }, (_, i) => {
      const dayStart = now - (buckets - 1 - i) * dayMs;
      const dayEnd = dayStart + dayMs;
      const count = filtered.filter((s) => s.timestamp >= dayStart && s.timestamp < dayEnd).length;
      const date = new Date(dayStart);
      return {
        day: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
        searches: count,
      };
    });

    // Hourly
    const hourCounts = new Array(24).fill(0);
    filtered.forEach((s) => hourCounts[new Date(s.timestamp).getHours()]++);
    const hourlyData = hourCounts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      searches: count,
    }));

    const avgSearchTime = savedInRange.length > 0
      ? Math.round(savedInRange.reduce((sum, s) => sum + s.searchTime, 0) / savedInRange.length)
      : 0;
    const avgSources = savedInRange.length > 0
      ? (savedInRange.reduce((sum, s) => sum + s.result.sources.length, 0) / savedInRange.length).toFixed(1)
      : "0";

    // Word cloud (uses inRange, ignores wordFilter so user can switch terms)
    const wordCounts: Record<string, number> = {};
    inRange.forEach((s) => {
      s.query.toLowerCase().split(/[^a-z0-9'-]+/).forEach((w) => {
        if (w.length < 3 || STOP_WORDS.has(w)) return;
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
    });
    const wordCloud = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word, count]) => ({ word, count }));

    return {
      totalSearches: filtered.length,
      savedCount: savedInRange.length,
      popularQueries,
      dailyTrend,
      hourlyData,
      avgSearchTime,
      avgSources,
      wordCloud,
      filtered,
      tableRows,
    };
  }, [history, saved, range, wordFilter]);

  const sortedRows = useMemo(() => {
    const rows = [...stats.tableRows];
    const mul = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sortKey === "query") return a.query.localeCompare(b.query) * mul;
      if (sortKey === "duration") return ((a.duration ?? -1) - (b.duration ?? -1)) * mul;
      return (a.timestamp - b.timestamp) * mul;
    });
    return rows;
  }, [stats.tableRows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "query" ? "asc" : "desc"); }
  };
  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? <span className="inline-block w-3" /> : sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 inline" /> : <ArrowDown className="h-3 w-3 inline" />;

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const rows: (string | number)[][] = [];
    rows.push(["Search Analytics Export"]);
    rows.push(["Generated", new Date().toISOString()]);
    rows.push(["Range", RANGE_LABELS[range]]);
    if (wordFilter) rows.push(["Word filter", wordFilter]);
    rows.push([]);
    rows.push(["Section: Search History"]);
    rows.push(["Query", "Timestamp (ISO)"]);
    stats.filtered
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp)
      .forEach((s) => rows.push([s.query, new Date(s.timestamp).toISOString()]));
    rows.push([]);
    rows.push(["Section: Popular Queries"]);
    rows.push(["Rank", "Query", "Count"]);
    stats.popularQueries.forEach((q, i) => rows.push([i + 1, q.query, q.count]));
    downloadCsv(`search-analytics-${stamp}.csv`, rows);
  };

  if (history.length === 0 && saved.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No search data yet. Start searching to see analytics!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          value={range}
          onValueChange={(v) => v && setRange(v as RangeKey)}
          variant="outline"
          size="sm"
        >
          {(Object.keys(RANGE_LABELS) as RangeKey[]).map((k) => (
            <ToggleGroupItem key={k} value={k} className="text-xs px-3">
              {RANGE_LABELS[k]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          {onClear && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all search statistics?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your search history and saved searches. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {wordFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtering by term:</span>
          <Badge variant="secondary" className="gap-1.5">
            {wordFilter}
            <button onClick={() => setWordFilter(null)} className="hover:text-foreground" aria-label="Clear filter">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Searches", value: stats.totalSearches, icon: Search, color: "text-primary" },
          { label: "Saved Searches", value: stats.savedCount, icon: Hash, color: "text-blue-500" },
          { label: "Avg Response", value: `${(stats.avgSearchTime / 1000).toFixed(1)}s`, icon: Zap, color: "text-amber-500" },
          { label: "Avg Sources", value: stats.avgSources, icon: TrendingUp, color: "text-green-500" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Search Activity ({RANGE_LABELS[range]})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyTrend}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="searches"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> Peak Search Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hourlyData.filter((h) => h.searches > 0)}>
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="searches" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular queries */}
      {stats.popularQueries.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" /> Popular Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
              {stats.popularQueries.map((item, i) => {
                const maxCount = stats.popularQueries[0]?.count || 1;
                const pct = (item.count / maxCount) * 100;
                return (
                  <motion.div
                    key={item.query}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <span className="text-xs font-mono text-muted-foreground/60 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm text-foreground truncate">{item.query}</span>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{item.count}×</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
                          className="h-full rounded-full bg-primary/70"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {stats.popularQueries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No queries match the current filter.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Word Cloud */}
      {stats.wordCloud.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Cloud className="h-4 w-4" /> Query Word Cloud
              <span className="text-xs font-normal text-muted-foreground/70 ml-1">— click a term to filter</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-x-3 gap-y-2 items-center justify-center py-3">
              {stats.wordCloud.map((item, i) => {
                const max = stats.wordCloud[0].count;
                const min = stats.wordCloud[stats.wordCloud.length - 1].count;
                const range = Math.max(1, max - min);
                const t = (item.count - min) / range;
                const fontSize = 0.8 + t * 1.8;
                const opacity = 0.5 + t * 0.5;
                const weight = t > 0.66 ? 700 : t > 0.33 ? 600 : 500;
                const isActive = wordFilter === item.word;
                const colorClass = isActive
                  ? "text-primary"
                  : t > 0.66 ? "text-primary/80" : t > 0.33 ? "text-foreground" : "text-muted-foreground";
                return (
                  <motion.button
                    key={item.word}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity, scale: 1 }}
                    transition={{ delay: i * 0.02, type: "spring", stiffness: 200 }}
                    style={{ fontSize: `${fontSize}rem`, fontWeight: weight, lineHeight: 1.1 }}
                    className={`${colorClass} inline-block hover:text-primary transition-colors cursor-pointer ${isActive ? "underline underline-offset-4" : ""}`}
                    title={`${item.word} — ${item.count}× (click to filter)`}
                    onClick={() => setWordFilter(isActive ? null : item.word)}
                  >
                    {item.word}
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
