import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Bot, Shield, Zap, Globe, Brain } from "lucide-react";
import omepilotLogo from "@/assets/omepilot-logo.png";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <img src={omepilotLogo} alt="Omepilot" className="w-10 h-10" />
            About Omepilot
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Omepilot is your AI-powered assistant designed to help you explore, create, and learn. 
            Built with cutting-edge AI technology to provide intelligent conversations and creative solutions.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Bot className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Smart Chat</h4>
                <p className="text-xs text-muted-foreground">Multiple AI personas for different tasks</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Image Generation</h4>
                <p className="text-xs text-muted-foreground">Create stunning visuals with AI</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Globe className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Web Search</h4>
                <p className="text-xs text-muted-foreground">Research with AI-powered search</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Brain className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">AI Memory</h4>
                <p className="text-xs text-muted-foreground">Personalized context & recall</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Quiz Generator</h4>
                <p className="text-xs text-muted-foreground">Create quizzes from any topic</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Secure</h4>
                <p className="text-xs text-muted-foreground">Your data is protected</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Version 1.0.0 • Made with ❤️ by Om
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
