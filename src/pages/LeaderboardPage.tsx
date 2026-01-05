import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Trophy, 
  Flame, 
  Star, 
  Medal,
  Crown,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  messages_sent: number;
  badges: unknown;
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'points' | 'streak' | 'messages'>('points');

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Fetch user stats with profiles
      const { data: stats, error } = await supabase
        .from('user_stats')
        .select(`
          user_id,
          total_points,
          current_streak,
          longest_streak,
          messages_sent,
          badges
        `)
        .order(
          sortBy === 'points' ? 'total_points' : 
          sortBy === 'streak' ? 'longest_streak' : 'messages_sent', 
          { ascending: false }
        )
        .limit(100);

      if (error) throw error;

      // Fetch usernames for each user
      const usersWithNames = await Promise.all(
        (stats || []).map(async (stat) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', stat.user_id)
            .single();

          return {
            ...stat,
            username: profile?.username || null,
          };
        })
      );

      setLeaderboard(usersWithNames);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-muted-foreground font-medium">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30";
    if (rank === 2) return "bg-gray-400/20 text-gray-600 border-gray-400/30";
    if (rank === 3) return "bg-amber-500/20 text-amber-600 border-amber-500/30";
    if (rank <= 10) return "bg-primary/10 text-primary border-primary/20";
    return "bg-muted text-muted-foreground border-border";
  };

  const currentUserRank = leaderboard.findIndex(entry => entry.user_id === currentUserId) + 1;
  const currentUserStats = leaderboard.find(entry => entry.user_id === currentUserId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <div>
              <h1 className="text-xl font-semibold">Leaderboard</h1>
              <p className="text-sm text-muted-foreground">Top users by activity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Current User Stats */}
        {currentUserStats && (
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {currentUserStats.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                      {getRankIcon(currentUserRank)}
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{currentUserStats.username || 'You'}</p>
                    <p className="text-sm text-muted-foreground">Rank #{currentUserRank}</p>
                  </div>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{currentUserStats.total_points}</p>
                    <p className="text-xs text-muted-foreground">Points</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-500">{currentUserStats.current_streak}</p>
                    <p className="text-xs text-muted-foreground">Streak</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-500">{currentUserStats.messages_sent}</p>
                    <p className="text-xs text-muted-foreground">Messages</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Tabs */}
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="points" className="gap-2">
              <Star className="h-4 w-4" />
              Points
            </TabsTrigger>
            <TabsTrigger value="streak" className="gap-2">
              <Flame className="h-4 w-4" />
              Streaks
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top {leaderboard.length} Users
              </CardTitle>
              <CardDescription>
                {sortBy === 'points' && 'Ranked by total points earned'}
                {sortBy === 'streak' && 'Ranked by longest streak maintained'}
                {sortBy === 'messages' && 'Ranked by total messages sent'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No users on the leaderboard yet</p>
                    <p className="text-sm">Start chatting to earn points!</p>
                  </div>
                ) : (
                  leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const isCurrentUser = entry.user_id === currentUserId;

                    return (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                          isCurrentUser 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="w-8 flex justify-center">
                          {getRankIcon(rank)}
                        </div>
                        
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={rank <= 3 ? 'bg-primary text-primary-foreground' : ''}>
                            {entry.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {entry.username || 'Anonymous User'}
                            {isCurrentUser && <span className="text-primary ml-2">(You)</span>}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Flame className="h-3 w-3 text-orange-500" />
                              {entry.current_streak} day streak
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          {sortBy === 'points' && (
                            <Badge variant="secondary" className={getRankBadge(rank)}>
                              <Star className="h-3 w-3 mr-1" />
                              {entry.total_points.toLocaleString()}
                            </Badge>
                          )}
                          {sortBy === 'streak' && (
                            <Badge variant="secondary" className={getRankBadge(rank)}>
                              <Flame className="h-3 w-3 mr-1" />
                              {entry.longest_streak} days
                            </Badge>
                          )}
                          {sortBy === 'messages' && (
                            <Badge variant="secondary" className={getRankBadge(rank)}>
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {entry.messages_sent.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}