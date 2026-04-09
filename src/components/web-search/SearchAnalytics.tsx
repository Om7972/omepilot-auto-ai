import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, Search, Hash, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import type { SearchHistoryItem, SavedSearch } from "./types";
import { motion } from "framer-motion";

interface Props {
  history: SearchHistoryItem[];
  saved: SavedSearch[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 80%, 55%)",
  "hsl(340, 70%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(45, 80%, 50%)",
];

export const SearchAnalytics = ({ history, saved }: Props) => {
  const stats = useMemo(() => {
    const allSearches = [
      ...history.map((h) => ({ query: h.query, timestamp: h.timestamp })),
      ...saved.map((s) => ({ query: s.query, timestamp: s.savedAt })),
    ];

    // Deduplicate by query+timestamp
    const unique = allSearches.filter(
      (item, i, arr) =>
        arr.findIndex((x) => x.query === item.query && x.timestamp === item.timestamp) === i
    );

    // Popular queries (frequency count from all data)
    const queryCounts: Record<string, number> = {};
    unique.forEach((s) => {
      const q = s.query.toLowerCase().trim();
      queryCounts[q] = (queryCounts[q] || 0) + 1;
    });
    const popularQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([query, count]) => ({ query, count }));

    // Daily trend (last 7 days)
    const now = Date.now();
    const dayMs = 86400000;
    const dailyTrend = Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (6 - i) * dayMs;
      const dayEnd = dayStart + dayMs;
      const count = unique.filter((s) => s.timestamp >= dayStart && s.timestamp < dayEnd).length;
      const date = new Date(dayStart);
      return {
        day: date.toLocaleDateString("en", { weekday: "short" }),
        date: date.toLocaleDateString("en", { month: "short", day: "numeric" }),
        searches: count,
      };
    });

    // Hourly distribution
    const hourCounts = new Array(24).fill(0);
    unique.forEach((s) => {
      const hour = new Date(s.timestamp).getHours();
      hourCounts[hour]++;
    });
    const hourlyData = hourCounts.map((count, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      searches: count,
    }));

    // Avg search time from saved
    const avgSearchTime =
      saved.length > 0
        ? Math.round(saved.reduce((sum, s) => sum + s.searchTime, 0) / saved.length)
        : 0;

    // Avg sources per search
    const avgSources =
      saved.length > 0
        ? (saved.reduce((sum, s) => sum + s.result.sources.length, 0) / saved.length).toFixed(1)
        : "0";

    return {
      totalSearches: unique.length,
      savedCount: saved.length,
      popularQueries,
      dailyTrend,
      hourlyData,
      avgSearchTime,
      avgSources,
    };
  }, [history, saved]);

  if (stats.totalSearches === 0) {
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
        {/* Daily trend */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Search Activity (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyTrend}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                      color: "hsl(var(--foreground))",
                    }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ""}
                  />
                  <Line
                    type="monotone"
                    dataKey="searches"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Peak hours */}
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
                    <span className="text-xs font-mono text-muted-foreground/60 w-5 text-right">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm text-foreground truncate">{item.query}</span>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {item.count}×
                        </span>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};
