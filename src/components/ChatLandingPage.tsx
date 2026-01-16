import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Brain, Zap, Image, FileText, Code, ArrowRight, MessageSquare, Sparkles
} from "lucide-react";
import omepilotLogo from "@/assets/omepilot-logo.png";
import { useAuth } from "@/contexts/AuthContext";

interface ChatLandingPageProps {
  userName: string;
  onQuickAction: (action: string) => void;
}

const features = [
  {
    icon: Brain,
    title: "Smart AI Chat",
    description: "Multi-model AI with context-aware responses",
  },
  {
    icon: Image,
    title: "Image Generation",
    description: "Create stunning visuals instantly",
  },
  {
    icon: FileText,
    title: "Document Analysis",
    description: "Extract insights from any document",
  },
  {
    icon: Code,
    title: "Code Assistant",
    description: "Full-stack development support",
  },
];

const quickActions = [
  { text: "Create an image", icon: Image },
  { text: "Write code", icon: Code },
  { text: "Analyze a document", icon: FileText },
  { text: "Brainstorm ideas", icon: Sparkles },
];

export const ChatLandingPage = ({ userName, onQuickAction }: ChatLandingPageProps) => {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative flex flex-col items-center min-h-full px-4 py-8 md:py-16 lg:py-24 max-w-5xl mx-auto">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px] opacity-60" />
      </div>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-6 mb-12 md:mb-16 z-10 text-center"
      >
        {/* Logo */}
        <motion.div 
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <img 
            src={omepilotLogo} 
            alt="OmePilot" 
            className="h-16 md:h-20 w-auto object-contain"
          />
        </motion.div>

        {/* Welcome Text */}
        <div className="space-y-3 max-w-lg">
          <motion.h1 
            className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {user ? `Welcome back, ${userName}` : "Welcome to OmePilot"}
          </motion.h1>
          
          <motion.p 
            className="text-sm md:text-base text-muted-foreground leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Your AI-powered assistant for creativity, coding, and productivity
          </motion.p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="relative w-full max-w-2xl z-10 mb-12 md:mb-16"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.text}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
            >
              <Button
                variant="outline"
                onClick={() => onQuickAction(action.text)}
                className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all group"
              >
                <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs text-center text-muted-foreground group-hover:text-foreground transition-colors">
                  {action.text}
                </span>
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="relative w-full z-10"
      >
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-center mb-6">
          What you can do
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
              className="group p-5 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/20 transition-all"
            >
              <feature.icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: mounted ? 1 : 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="relative mt-12 md:mt-16 z-10 text-center"
      >
        <p className="text-sm text-muted-foreground mb-4">
          Start typing below or choose a quick action above
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
          <MessageSquare className="h-3 w-3" />
          <span>Press Enter to send</span>
        </div>
      </motion.div>
    </div>
  );
};
