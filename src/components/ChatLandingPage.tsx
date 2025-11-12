import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Brain, Zap, MessageSquare, Image, FileText, Code, Lightbulb } from "lucide-react";
import omepilotLogo from "@/assets/omepilot-logo.png";

interface ChatLandingPageProps {
  userName: string;
  onQuickAction: (action: string) => void;
}

const features = [
  {
    icon: Brain,
    title: "Smart Conversations",
    description: "Powered by multiple AI models for intelligent responses"
  },
  {
    icon: Image,
    title: "Image Generation",
    description: "Create stunning visuals with AI-powered image generation"
  },
  {
    icon: FileText,
    title: "Document Processing",
    description: "Analyze and extract insights from your documents"
  },
  {
    icon: Code,
    title: "Code Assistance",
    description: "Get help with programming and technical tasks"
  }
];

const quickActions = [
  { text: "Create an image", icon: Sparkles },
  { text: "Write a first draft", icon: FileText },
  { text: "Improve writing", icon: Lightbulb },
  { text: "Write a joke", icon: MessageSquare },
  { text: "Design a logo", icon: Image },
  { text: "Clean up notes", icon: FileText },
];

export const ChatLandingPage = ({ userName, onQuickAction }: ChatLandingPageProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12 max-w-6xl mx-auto">
      {/* Logo and Welcome */}
      <div className="flex flex-col items-center gap-6 mb-16">
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
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 w-full">
        {features.map((feature, index) => (
          <Card 
            key={feature.title}
            className="group p-6 hover:bg-gradient-to-br hover:from-primary/5 hover:to-accent/5 transition-all duration-300 hover:shadow-xl hover:scale-105 border-border/50 hover:border-primary/50 cursor-pointer"
          >
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-6 w-full">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            ✨ Quick Start
          </h2>
          <p className="text-muted-foreground">
            Jump right in with these popular actions
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {quickActions.map((action, index) => (
            <Button
              key={action.text}
              variant="outline"
              onClick={() => onQuickAction(action.text)}
              className="group hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <action.icon className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              {action.text}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats or Features Footer */}
      <div className="mt-16 pt-8 border-t border-border/50 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl font-bold text-primary">∞</div>
            <div className="text-sm text-muted-foreground">Unlimited Creativity</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-accent">⚡</div>
            <div className="text-sm text-muted-foreground">Lightning Fast</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-primary">🎯</div>
            <div className="text-sm text-muted-foreground">Always Accurate</div>
          </div>
        </div>
      </div>
    </div>
  );
};
