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
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      {/* Logo and Welcome */}
      <div className="flex flex-col items-center gap-6 mb-12">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
          <img 
            src={omepilotLogo} 
            alt="Omepilot" 
            className="w-24 h-24 relative z-10 drop-shadow-lg"
          />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Welcome, {userName}!
          </h1>
          <p className="text-lg text-muted-foreground">
            How can I help you today?
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-6xl w-full">
        {features.map((feature) => (
          <Card 
            key={feature.title}
            className="p-5 hover:bg-card/80 transition-all duration-300 hover:shadow-lg hover:scale-105 border-border/50"
          >
            <feature.icon className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4 max-w-3xl w-full">
        <h2 className="text-xl font-semibold text-center text-foreground">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3 justify-center">
          {quickActions.map((action) => (
            <Button
              key={action.text}
              variant="secondary"
              onClick={() => onQuickAction(action.text)}
              className="hover:bg-primary hover:text-primary-foreground transition-all duration-300 group"
            >
              <action.icon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              {action.text}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
