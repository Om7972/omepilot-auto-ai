import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Zap, MessageCircle, Brain, Users, FileText, Globe, Search, Shield, Settings } from "lucide-react";

const sections = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    content: [
      {
        heading: "Creating Your First Conversation",
        text: "Click the '+' button in the sidebar or press Ctrl/Cmd + N to start a new conversation. Type your message and press Enter to send it to the AI."
      },
      {
        heading: "Choosing an AI Model",
        text: "Select from multiple AI models optimized for different tasks: GPT-5 for complex reasoning, Gemini for quick responses, Groq for ultra-fast replies, and Claude for deep thinking."
      },
    ]
  },
  {
    id: "chat",
    title: "AI Chat",
    icon: MessageCircle,
    content: [
      {
        heading: "Sending Messages",
        text: "Type your message in the input area and press Enter to send. Use Shift+Enter for new lines. You can attach files using the paperclip icon."
      },
      {
        heading: "Message Actions",
        text: "Hover over any message to access reactions, pin messages, copy content, or provide feedback on AI responses."
      },
    ]
  },
  {
    id: "memory",
    title: "Memory",
    icon: Brain,
    content: [
      {
        heading: "How Memory Works",
        text: "Memory stores key information from your conversations. The AI uses these memories to provide more personalized and contextual responses across all your chats."
      },
      {
        heading: "Managing Memories",
        text: "Navigate to the Memory section to view, edit, or delete stored memories. You can categorize memories for better organization."
      },
    ]
  },
  {
    id: "collaboration",
    title: "Collaboration",
    icon: Users,
    content: [
      {
        heading: "Starting a Collaborative Session",
        text: "Click the Users icon in any conversation to enable collaborative mode. Share the generated link with team members to invite them."
      },
      {
        heading: "Real-time Features",
        text: "See who's online with presence indicators, get notifications when members join or send messages, and collaborate in real-time."
      },
    ]
  },
  {
    id: "documents",
    title: "Document Analysis",
    icon: FileText,
    content: [
      {
        heading: "Uploading Documents",
        text: "Use the attachment button to upload PDFs, images, and text files. The AI will extract and analyze the content automatically."
      },
      {
        heading: "Asking Questions",
        text: "After uploading a document, ask questions about its content. The AI will reference the document to provide accurate answers."
      },
    ]
  },
  {
    id: "search",
    title: "Web Search",
    icon: Globe,
    content: [
      {
        heading: "AI-Powered Search",
        text: "Use the web search feature to find current information from the internet. The AI will summarize and present relevant results."
      },
    ]
  },
  {
    id: "quiz",
    title: "Quiz Generation",
    icon: BookOpen,
    content: [
      {
        heading: "Creating Quizzes",
        text: "Navigate to the Quiz section, upload a document or paste text, and the AI will automatically generate questions based on the content."
      },
      {
        heading: "Taking Quizzes",
        text: "Answer generated questions and get instant feedback with explanations for each answer."
      },
    ]
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    icon: Settings,
    content: [
      {
        heading: "Essential Shortcuts",
        text: "Ctrl+N: New chat • Enter: Send message • Shift+Enter: New line • Ctrl+B: Toggle sidebar • ?: Show all shortcuts"
      },
    ]
  },
  {
    id: "privacy",
    title: "Privacy & Security",
    icon: Shield,
    content: [
      {
        heading: "Data Protection",
        text: "Your conversations are encrypted and stored securely. Only you can access your data unless you explicitly share a conversation."
      },
      {
        heading: "Sharing Controls",
        text: "When you share a conversation, a unique token is generated. You can revoke access at any time by disabling the share link."
      },
    ]
  },
];

export default function DocumentationPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("getting-started");

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar nav */}
        <div className="w-56 border-r border-border bg-muted/30 hidden md:block">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Documentation
            </h2>
          </div>
          <ScrollArea className="h-[calc(100vh-57px)]">
            <nav className="p-2 space-y-0.5">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    activeSection === section.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <section.icon className="h-4 w-4 flex-shrink-0" />
                  {section.title}
                </button>
              ))}
            </nav>
          </ScrollArea>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto p-6 md:p-10">
            {/* Mobile section selector */}
            <div className="md:hidden mb-6">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
                className="w-full p-2 rounded-lg border border-border bg-background text-sm"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            {sections
              .filter((s) => s.id === activeSection)
              .map((section) => (
                <div key={section.id}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">{section.title}</h1>
                  </div>
                  <div className="space-y-6">
                    {section.content.map((item, idx) => (
                      <div key={idx} className="rounded-xl border border-border bg-card p-5">
                        <h3 className="font-semibold mb-2">{item.heading}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
