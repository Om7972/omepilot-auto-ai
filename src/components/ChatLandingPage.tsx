import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Brain, Zap, MessageSquare, Image, FileText, Code, 
  Lightbulb, Flame, Star, Wand2, Palette, BookOpen, Terminal,
  ArrowRight
} from "lucide-react";
import omepilotLogo from "@/assets/omepilot-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { FloatingParticles } from "./landing/FloatingParticles";
import { AnimatedFeatureCard } from "./landing/AnimatedFeatureCard";
import { QuickActionPill } from "./landing/QuickActionPill";
import { StatsCounter } from "./landing/StatsCounter";
import { PlatformShowcase } from "./landing/PlatformShowcase";
import { GlowingButton } from "./landing/GlowingButton";
import { cn } from "@/lib/utils";

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
    description: "Multi-model AI orchestration with context-aware responses",
    gradient: "bg-gradient-to-br from-violet-500 to-purple-600"
  },
  {
    icon: Wand2,
    title: "Image Generation",
    description: "Create stunning visuals with state-of-the-art diffusion models",
    gradient: "bg-gradient-to-br from-pink-500 to-rose-600"
  },
  {
    icon: BookOpen,
    title: "Document Intelligence",
    description: "Extract, analyze, and synthesize insights from any document",
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-600"
  },
  {
    icon: Terminal,
    title: "Code Assistance",
    description: "Full-stack development support with real-time debugging",
    gradient: "bg-gradient-to-br from-blue-500 to-cyan-600"
  }
];

const quickActions = [
  { text: "Create an image", icon: Palette, color: "text-pink-500" },
  { text: "Write a first draft", icon: FileText, color: "text-blue-500" },
  { text: "Improve writing", icon: Lightbulb, color: "text-yellow-500" },
  { text: "Write code", icon: Code, color: "text-green-500" },
  { text: "Brainstorm ideas", icon: Sparkles, color: "text-purple-500" },
  { text: "Analyze data", icon: Zap, color: "text-orange-500" },
];

export const ChatLandingPage = ({ userName, onQuickAction }: ChatLandingPageProps) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    <div className="relative flex flex-col items-center min-h-full px-4 py-8 md:py-12 max-w-7xl mx-auto overflow-hidden">
      {/* Three.js Particle Background */}
      <Suspense fallback={null}>
        <FloatingParticles />
      </Suspense>
      
      {/* Gradient Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-[100px] opacity-50 animate-pulse" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[120px] opacity-40" />

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative flex flex-col items-center gap-6 mb-12 z-10"
      >
        {/* Logo with glow effect */}
        <motion.div 
          className="relative group"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary blur-3xl rounded-full animate-pulse opacity-60" />
          <motion.div 
            className="relative z-10 p-8 rounded-3xl bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-xl border border-primary/20 shadow-2xl"
            animate={{ 
              boxShadow: [
                "0 0 30px rgba(139, 92, 246, 0.3)",
                "0 0 60px rgba(139, 92, 246, 0.5)",
                "0 0 30px rgba(139, 92, 246, 0.3)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <img 
              src={omepilotLogo} 
              alt="Omepilot" 
              className="w-24 h-24 drop-shadow-2xl"
            />
          </motion.div>
        </motion.div>

        {/* Welcome Text */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-1"
          >
            <span className="text-sm md:text-base font-medium text-muted-foreground uppercase tracking-wider">
              Welcome back
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              {userName}
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Your AI-powered command center for creativity and productivity
          </motion.p>
        </div>

        {/* User Stats Inline */}
        <AnimatePresence>
          {stats && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-4 text-sm"
            >
              {stats.current_streak > 0 && (
                <div className="flex items-center gap-1.5 text-orange-500">
                  <Flame className="h-4 w-4" />
                  <span className="font-semibold">{stats.current_streak}</span>
                  <span className="text-muted-foreground">day streak</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-primary">
                <Star className="h-4 w-4" />
                <span className="font-semibold">{stats.total_points.toLocaleString()}</span>
                <span className="text-muted-foreground">XP</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-500">
                <MessageSquare className="h-4 w-4" />
                <span className="font-semibold">{stats.messages_sent.toLocaleString()}</span>
                <span className="text-muted-foreground">messages</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Feature Cards Grid */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-16 w-full z-10">
        {features.map((feature, i) => (
          <AnimatedFeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            gradient={feature.gradient}
            delay={0.2 + i * 0.1}
          />
        ))}
      </div>

      {/* Quick Actions Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative w-full z-10 space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-3">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="h-7 w-7 text-primary" />
            </motion.span>
            Quick Start
          </h2>
          <p className="text-muted-foreground">
            Jump into action with these popular commands
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
          {quickActions.map((action, i) => (
            <QuickActionPill
              key={action.text}
              text={action.text}
              icon={action.icon}
              color={action.color}
              onClick={() => onQuickAction(action.text)}
              delay={0.7 + i * 0.05}
            />
          ))}
        </div>
      </motion.div>

      {/* Removed duplicate stats section - stats are now shown inline in hero */}

      {/* Platform Showcase */}
      <PlatformShowcase />
    </div>
  );
};
