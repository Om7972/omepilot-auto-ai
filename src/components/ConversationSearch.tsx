import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Calendar, MessageSquare, Users, Filter, 
  Clock, ChevronRight, Loader2, X, SlidersHorizontal
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "conversation" | "message";
  title: string;
  content: string;
  conversationId: string;
  createdAt: string;
  isCollaborative?: boolean;
  matchedText?: string;
}

interface Filters {
  dateRange: string;
  type: string;
  collaborative: boolean | null;
}

export const ConversationSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    dateRange: "all",
    type: "all",
    collaborative: null,
  });

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const searchResults: SearchResult[] = [];

      // Search conversations
      if (filters.type === "all" || filters.type === "conversations") {
        let convQuery = supabase
          .from("conversations")
          .select("id, title, created_at, is_collaborative")
          .eq("user_id", user.id)
          .ilike("title", `%${query}%`)
          .order("created_at", { ascending: false })
          .limit(20);

        if (filters.collaborative !== null) {
          convQuery = convQuery.eq("is_collaborative", filters.collaborative);
        }

        if (filters.dateRange !== "all") {
          const now = new Date();
          let fromDate: Date;
          
          switch (filters.dateRange) {
            case "today":
              fromDate = new Date(now.setHours(0, 0, 0, 0));
              break;
            case "week":
              fromDate = new Date(now.setDate(now.getDate() - 7));
              break;
            case "month":
              fromDate = new Date(now.setMonth(now.getMonth() - 1));
              break;
            default:
              fromDate = new Date(0);
          }
          
          convQuery = convQuery.gte("created_at", fromDate.toISOString());
        }

        const { data: conversations } = await convQuery;

        conversations?.forEach((conv) => {
          searchResults.push({
            id: conv.id,
            type: "conversation",
            title: conv.title || "Untitled Conversation",
            content: "",
            conversationId: conv.id,
            createdAt: conv.created_at,
            isCollaborative: conv.is_collaborative,
          });
        });
      }

      // Search messages
      if (filters.type === "all" || filters.type === "messages") {
        let msgQuery = supabase
          .from("messages")
          .select(`
            id, 
            content, 
            created_at, 
            conversation_id,
            conversations!inner(user_id, title, is_collaborative)
          `)
          .ilike("content", `%${query}%`)
          .order("created_at", { ascending: false })
          .limit(30);

        const { data: messages } = await msgQuery;

        messages?.forEach((msg: any) => {
          if (msg.conversations?.user_id === user.id) {
            if (filters.collaborative !== null && 
                msg.conversations.is_collaborative !== filters.collaborative) {
              return;
            }

            const matchIndex = msg.content.toLowerCase().indexOf(query.toLowerCase());
            const start = Math.max(0, matchIndex - 50);
            const end = Math.min(msg.content.length, matchIndex + query.length + 50);
            const matchedText = (start > 0 ? "..." : "") + 
              msg.content.slice(start, end) + 
              (end < msg.content.length ? "..." : "");

            searchResults.push({
              id: msg.id,
              type: "message",
              title: msg.conversations?.title || "Untitled Conversation",
              content: msg.content,
              conversationId: msg.conversation_id,
              createdAt: msg.created_at,
              isCollaborative: msg.conversations?.is_collaborative,
              matchedText,
            });
          }
        });
      }

      // Sort by date
      searchResults.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      performSearch();
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
  };

  const openResult = (result: SearchResult) => {
    navigate(`/chat/${result.conversationId}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Header */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Search className="h-5 w-5 text-primary" />
            Search Conversations & Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for conversations or messages..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-9 bg-background"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button onClick={performSearch} disabled={isSearching || !query.trim()}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {(filters.dateRange !== "all" || filters.type !== "all" || filters.collaborative !== null) && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {[
                        filters.dateRange !== "all",
                        filters.type !== "all",
                        filters.collaborative !== null,
                      ].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase">Date Range</Label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Past Week</SelectItem>
                        <SelectItem value="month">Past Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase">Search In</Label>
                    <Select
                      value={filters.type}
                      onValueChange={(value) => setFilters({ ...filters, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="conversations">Conversations Only</SelectItem>
                        <SelectItem value="messages">Messages Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase">Collaboration</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="collab-all"
                          checked={filters.collaborative === null}
                          onCheckedChange={() => setFilters({ ...filters, collaborative: null })}
                        />
                        <Label htmlFor="collab-all" className="text-sm">All</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="collab-yes"
                          checked={filters.collaborative === true}
                          onCheckedChange={() => setFilters({ ...filters, collaborative: true })}
                        />
                        <Label htmlFor="collab-yes" className="text-sm">Shared</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="collab-no"
                          checked={filters.collaborative === false}
                          onCheckedChange={() => setFilters({ ...filters, collaborative: false })}
                        />
                        <Label htmlFor="collab-no" className="text-sm">Private</Label>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setFilters({ dateRange: "all", type: "all", collaborative: null })}
                  >
                    Reset Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Active filter badges */}
            <div className="flex gap-2 flex-wrap">
              {filters.dateRange !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {filters.dateRange}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => setFilters({ ...filters, dateRange: "all" })}
                  />
                </Badge>
              )}
              {filters.type !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  {filters.type}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => setFilters({ ...filters, type: "all" })}
                  />
                </Badge>
              )}
              {filters.collaborative !== null && (
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {filters.collaborative ? "Shared" : "Private"}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => setFilters({ ...filters, collaborative: null })}
                  />
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </motion.div>
        ) : hasSearched ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {results.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{results.length} result{results.length !== 1 ? "s" : ""} found</span>
                </div>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 pr-4">
                    {results.map((result, index) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={cn(
                            "cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50",
                            "border-border/50 bg-card/60"
                          )}
                          onClick={() => openResult(result)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "text-xs",
                                      result.type === "conversation" 
                                        ? "border-primary/50 text-primary" 
                                        : "border-blue-500/50 text-blue-500"
                                    )}
                                  >
                                    {result.type === "conversation" ? (
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                    ) : (
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                    )}
                                    {result.type}
                                  </Badge>
                                  {result.isCollaborative && (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                      <Users className="h-3 w-3" />
                                      Shared
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-medium truncate">{result.title}</h4>
                                {result.matchedText && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {result.matchedText}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
                                <ChevronRight className="h-4 w-4" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <Card className="border-border/50 bg-card/60">
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium text-lg mb-2">No results found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search query or filters
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="border-border/50 bg-card/60">
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg mb-2">Search your conversations</h3>
                <p className="text-sm text-muted-foreground">
                  Find any conversation or message across your chat history
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
