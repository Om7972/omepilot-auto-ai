import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Zap, Star, Award, Target, Crown, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserStats {
  total_points: number;
  current_streak: number;
  longest_streak: number;
  messages_sent: number;
  conversations_created: number;
  badges: Badge[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
}

const BADGE_DEFINITIONS = [
  { id: "first_message", name: "First Steps", description: "Send your first message", icon: "star", threshold: 1, field: "messages_sent" },
  { id: "chatty", name: "Chatty", description: "Send 50 messages", icon: "zap", threshold: 50, field: "messages_sent" },
  { id: "conversationalist", name: "Conversationalist", description: "Send 200 messages", icon: "trophy", threshold: 200, field: "messages_sent" },
  { id: "streak_3", name: "On Fire", description: "3 day streak", icon: "flame", threshold: 3, field: "current_streak" },
  { id: "streak_7", name: "Week Warrior", description: "7 day streak", icon: "crown", threshold: 7, field: "current_streak" },
  { id: "streak_30", name: "Monthly Master", description: "30 day streak", icon: "award", threshold: 30, field: "longest_streak" },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  zap: Zap,
  trophy: Trophy,
  flame: Flame,
  crown: Crown,
  award: Award,
};

const getLevel = (points: number) => {
  if (points < 100) return { level: 1, name: "Beginner", nextLevel: 100, color: "text-muted-foreground" };
  if (points < 500) return { level: 2, name: "Explorer", nextLevel: 500, color: "text-blue-500" };
  if (points < 1500) return { level: 3, name: "Enthusiast", nextLevel: 1500, color: "text-green-500" };
  if (points < 5000) return { level: 4, name: "Expert", nextLevel: 5000, color: "text-purple-500" };
  if (points < 15000) return { level: 5, name: "Master", nextLevel: 15000, color: "text-orange-500" };
  return { level: 6, name: "Legend", nextLevel: null, color: "text-yellow-500" };
};

export const UserStatsCard = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading stats:", error);
        return;
      }

      if (data) {
        setStats({
          ...data,
          badges: Array.isArray(data.badges) ? (data.badges as unknown as Badge[]) : [],
        });
      } else {
        // Initialize with defaults
        setStats({
          total_points: 0,
          current_streak: 0,
          longest_streak: 0,
          messages_sent: 0,
          conversations_created: 0,
          badges: [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const levelInfo = getLevel(stats.total_points);
  const progress = levelInfo.nextLevel 
    ? ((stats.total_points % (levelInfo.nextLevel / levelInfo.level)) / (levelInfo.nextLevel / levelInfo.level)) * 100
    : 100;

  // Calculate earned badges
  const earnedBadges = BADGE_DEFINITIONS.filter(badge => {
    const value = stats[badge.field as keyof UserStats] as number;
    return value >= badge.threshold;
  });

  return (
    <TooltipProvider>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Progress
              </CardTitle>
              <CardDescription>Keep up the great work!</CardDescription>
            </div>
            <Badge variant="secondary" className={`${levelInfo.color} font-bold`}>
              Level {levelInfo.level}: {levelInfo.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Points Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Experience Points</span>
              <span className="font-bold text-primary">{stats.total_points} XP</span>
            </div>
            <Progress value={progress} className="h-2" />
            {levelInfo.nextLevel && (
              <p className="text-xs text-muted-foreground text-right">
                {levelInfo.nextLevel - stats.total_points} XP to next level
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center mb-1">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">{stats.current_streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center mb-1">
                <Zap className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{stats.messages_sent}</p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{stats.longest_streak}</p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Achievements ({earnedBadges.length}/{BADGE_DEFINITIONS.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {BADGE_DEFINITIONS.map((badge) => {
                const isEarned = earnedBadges.some(b => b.id === badge.id);
                const IconComponent = ICON_MAP[badge.icon] || Star;
                
                return (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`p-2.5 rounded-full transition-all ${
                          isEarned 
                            ? "bg-primary/20 text-primary ring-2 ring-primary/30" 
                            : "bg-muted text-muted-foreground/40"
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <p className="font-medium">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                        {!isEarned && (
                          <p className="text-xs text-primary mt-1">Not yet earned</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
