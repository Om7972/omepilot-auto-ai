import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, Zap, MessageSquare, Image, FileText, Code, Lightbulb, Flame, Trophy, Star } from "lucide-react";
import omepilotLogo from "@/assets/omepilot-logo.png";
import { supabase } from "@/integrations/supabase/client";

interface ChatLandingPageProps {
  userName: string;
  onQuickAction: (action: string) => void;
}

interface UserStats {
  current_streak: number;
  total_points: number;
  messages_sent: number;
}

const features = [
  {
    icon: Brain,
    title: "Smart Conversations",
    description: "Powered by multiple AI models for intelligent responses",
    gradient: "from-purple-500/20 to-blue-500/20"
  },
  {
    icon: Image,
    title: "Image Generation",
    description: "Create stunning visuals with AI-powered image generation",
    gradient: "from-pink-500/20 to-orange-500/20"
  },
  {
    icon: FileText,
    title: "Document Processing",
    description: "Analyze and extract insights from your documents",
    gradient: "from-green-500/20 to-teal-500/20"
  },
  {
    icon: Code,
    title: "Code Assistance",
    description: "Get help with programming and technical tasks",
    gradient: "from-blue-500/20 to-cyan-500/20"
  }
];

const quickActions = [
  { text: "Create an image", icon: Sparkles, color: "text-pink-500" },
  { text: "Write a first draft", icon: FileText, color: "text-blue-500" },
  { text: "Improve writing", icon: Lightbulb, color: "text-yellow-500" },
  { text: "Write a joke", icon: MessageSquare, color: "text-green-500" },
  { text: "Design a logo", icon: Image, color: "text-purple-500" },
  { text: "Clean up notes", icon: FileText, color: "text-orange-500" },
];

export const ChatLandingPage = ({ userName, onQuickAction }: ChatLandingPageProps) => {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_stats")
        .select("current_streak, total_points, messages_sent")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12 max-w-6xl mx-auto">
      {/* Logo and Welcome */}
      <div className="flex flex-col items-center gap-6 mb-12">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative z-10 p-6 rounded-full bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm border border-primary/20">
            <img 
              src={omepilotLogo} 
              alt="Omepilot" 
              className="w-20 h-20 drop-shadow-2xl transition-transform group-hover:scale-110 duration-300"
            />
          </div>
        </div>
        <div className="text-center space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
            Welcome back, {userName}!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Your AI-powered workspace for creativity, productivity, and innovation
          </p>
        </div>

        {/* User Stats Mini Card */}
        {stats && (
          <div className="flex items-center gap-4 mt-4">
            {stats.current_streak > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 text-orange-600 border-orange-500/20">
                <Flame className="h-4 w-4" />
                {stats.current_streak} day streak
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border-primary/20">
              <Star className="h-4 w-4" />
              {stats.total_points} XP
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20">
              <MessageSquare className="h-4 w-4" />
              {stats.messages_sent} messages
            </Badge>
          </div>
        )}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 w-full">
        {features.map((feature) => (
          <Card 
            key={feature.title}
            className="group relative overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-50`} />
            <div className="relative p-6 space-y-4">
              <div className="p-3 rounded-xl bg-background/80 backdrop-blur-sm w-fit shadow-sm group-hover:shadow-md transition-shadow">
                <feature.icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-6 w-full">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Quick Start
          </h2>
          <p className="text-muted-foreground">
            Jump right in with these popular actions
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {quickActions.map((action) => (
            <Button
              key={action.text}
              variant="outline"
              onClick={() => onQuickAction(action.text)}
              className="group hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <action.icon className={`w-4 h-4 mr-2 ${action.color} group-hover:text-primary-foreground transition-colors group-hover:rotate-12`} />
              {action.text}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats or Features Footer */}
      <div className="mt-16 pt-8 border-t border-border/50 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-0 space-y-1">
              <div className="text-3xl font-bold text-primary">∞</div>
              <div className="text-sm text-muted-foreground">Unlimited Creativity</div>
            </CardContent>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-yellow-500/5 to-transparent border-yellow-500/20">
            <CardContent className="p-0 space-y-1">
              <div className="text-3xl font-bold text-yellow-500">⚡</div>
              <div className="text-sm text-muted-foreground">Lightning Fast</div>
            </CardContent>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
            <CardContent className="p-0 space-y-1">
              <div className="text-3xl font-bold text-green-500">🎯</div>
              <div className="text-sm text-muted-foreground">Always Accurate</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
