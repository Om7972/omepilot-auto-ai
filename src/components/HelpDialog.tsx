import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle, BookOpen, Zap, Users, Brain, FileText, Globe } from "lucide-react";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const faqs = [
  {
    question: "How do I start a new conversation?",
    answer: "Click the '+' button in the sidebar or navigate to the home page. You can also use keyboard shortcut Ctrl/Cmd + N."
  },
  {
    question: "How does collaborative mode work?",
    answer: "Collaborative mode allows multiple users to participate in the same conversation. Click the 'Users' icon in a chat to enable it and invite team members."
  },
  {
    question: "What AI models are available?",
    answer: "We offer GPT-5 for complex reasoning, Gemini for quick responses, Groq for ultra-fast replies, and Claude for deep thinking on complex topics."
  },
  {
    question: "How do I upload documents?",
    answer: "Use the attachment button in the chat input area to upload PDFs, images, and text files. The AI can analyze and answer questions about your documents."
  },
  {
    question: "What is the Memory feature?",
    answer: "Memory stores key information across conversations. The AI uses these memories to provide more personalized and contextual responses."
  },
  {
    question: "How do I generate quizzes?",
    answer: "Navigate to the Quiz section, upload a document or paste text, and the AI will automatically generate questions based on the content."
  }
];

const features = [
  { icon: MessageCircle, title: "AI Chat", description: "Have intelligent conversations with advanced AI models" },
  { icon: Brain, title: "Memory", description: "AI remembers important context across chats" },
  { icon: Users, title: "Collaboration", description: "Work together with team members in real-time" },
  { icon: BookOpen, title: "Quiz Generation", description: "Auto-generate quizzes from documents" },
  { icon: FileText, title: "Document Analysis", description: "Upload and analyze documents with AI" },
  { icon: Globe, title: "Web Search", description: "AI-powered web search for current information" },
];

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-primary" />
            Help & Support
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick Start */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quick Start
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-center"
                >
                  <feature.icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">{feature.title}</span>
                  <span className="text-xs text-muted-foreground">{feature.description}</span>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Frequently Asked Questions
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 rounded bg-muted/50">
                <span>New chat</span>
                <kbd className="px-2 py-0.5 bg-background rounded text-xs">Ctrl + N</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/50">
                <span>Send message</span>
                <kbd className="px-2 py-0.5 bg-background rounded text-xs">Enter</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/50">
                <span>New line</span>
                <kbd className="px-2 py-0.5 bg-background rounded text-xs">Shift + Enter</kbd>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/50">
                <span>Toggle sidebar</span>
                <kbd className="px-2 py-0.5 bg-background rounded text-xs">Ctrl + B</kbd>
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <section className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => { onOpenChange(false); navigate('/documentation'); }}>
              <ExternalLink className="h-4 w-4" />
              Documentation
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => { onOpenChange(false); navigate('/contact-support'); }}>
              <MessageCircle className="h-4 w-4" />
              Contact Support
            </Button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}