import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, Zap, MessageCircle, Brain, Users, FileText, Globe, Shield, Settings, 
  Search, Code, Image, Mic, CreditCard, BarChart3, Bell, Share2, Layers, 
  Terminal, Sparkles, Lock, HelpCircle, ArrowRight, ExternalLink, Lightbulb
} from "lucide-react";

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
  content: { heading: string; text: string; tips?: string[] }[];
}

const sections: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    content: [
      {
        heading: "Welcome to OmePilot",
        text: "OmePilot is a next-generation AI-powered workspace that combines conversational AI, document analysis, quiz generation, web search, and team collaboration into a single, unified platform. Whether you're a solo user or part of an enterprise team, OmePilot adapts to your workflow.",
        tips: ["Start by creating your first conversation using the '+' button or Ctrl/Cmd + N", "Explore the sidebar to discover all available features", "Set up your profile and preferences in Settings"]
      },
      {
        heading: "System Requirements",
        text: "OmePilot works on all modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, we recommend using the latest version of your browser. OmePilot is fully responsive and works on desktop, tablet, and mobile devices.",
      },
      {
        heading: "Quick Start Guide",
        text: "1. Sign up or log in to your account. 2. Create a new conversation from the sidebar. 3. Choose your preferred AI model from the model selector. 4. Start chatting — ask questions, upload documents, or explore AI capabilities. 5. Your conversations are automatically saved and can be accessed anytime.",
        tips: ["Use keyboard shortcuts to speed up your workflow", "Pin important conversations for quick access", "Try different AI models to find the best fit for your tasks"]
      },
      {
        heading: "Account Setup",
        text: "After signing up, complete your profile by adding your name, username, and bio. This information is used in collaborative sessions and the leaderboard. Navigate to Profile from the sidebar to update your details.",
      }
    ]
  },
  {
    id: "ai-models",
    title: "AI Models",
    icon: Sparkles,
    badge: "Popular",
    content: [
      {
        heading: "Available AI Models",
        text: "OmePilot provides access to multiple cutting-edge AI models, each optimized for different use cases. Choose the right model based on your needs — from fast responses to deep, complex reasoning.",
      },
      {
        heading: "GPT-5 & GPT-5 Mini",
        text: "OpenAI's most powerful models. GPT-5 excels at complex reasoning, creative writing, code generation, and multi-step problem solving. GPT-5 Mini offers a great balance of performance and speed at lower cost. Both support text and image inputs.",
        tips: ["Use GPT-5 for complex analysis and creative tasks", "Use GPT-5 Mini for everyday conversations and quick queries"]
      },
      {
        heading: "Gemini Pro & Flash",
        text: "Google's Gemini models are excellent for multimodal tasks combining text and images, handling large context windows, and providing fast responses. Gemini Flash is optimized for speed while maintaining high quality.",
        tips: ["Gemini Pro is ideal for document analysis with images", "Gemini Flash is great for quick summarization tasks"]
      },
      {
        heading: "Switching Models",
        text: "You can switch AI models at any time during a conversation using the model selector in the chat interface. Each model has different strengths — experiment to find the best fit for your specific task.",
      }
    ]
  },
  {
    id: "chat",
    title: "AI Chat",
    icon: MessageCircle,
    content: [
      {
        heading: "Sending Messages",
        text: "Type your message in the input area and press Enter to send. Use Shift+Enter for new lines within your message. The AI will respond in real-time with streaming text, so you can see the response as it's being generated.",
        tips: ["Be specific in your prompts for better results", "Provide context about what you're working on", "Use follow-up questions to refine responses"]
      },
      {
        heading: "Message Actions",
        text: "Hover over any message to reveal a set of actions: React with emojis to bookmark important messages, pin messages for quick reference, copy content to clipboard, regenerate AI responses, and provide feedback to help improve the AI.",
      },
      {
        heading: "File Attachments",
        text: "Attach files directly in your conversations using the paperclip icon. Supported formats include PDF documents, images (PNG, JPG, GIF, WebP), and text files. The AI will automatically analyze attached files and incorporate them into the conversation context.",
      },
      {
        heading: "Conversation Management",
        text: "All conversations are automatically saved and organized in the sidebar. You can rename conversations by clicking the title, pin important ones to the top, archive old conversations, and search through your history. Use folders and tags to keep everything organized.",
        tips: ["Pin frequently referenced conversations", "Archive completed projects to keep your sidebar clean", "Use search to quickly find past conversations"]
      },
      {
        heading: "Exporting Conversations",
        text: "Export any conversation as a PDF or text file for offline reference, sharing, or documentation purposes. Click the export button in the conversation menu to choose your preferred format.",
      }
    ]
  },
  {
    id: "documents",
    title: "Document Analysis",
    icon: FileText,
    content: [
      {
        heading: "Uploading Documents",
        text: "Use the attachment button to upload PDFs, images, and text files directly into your conversations. OmePilot uses advanced OCR and text extraction to process your documents, making the content available for AI analysis.",
        tips: ["For best results with PDFs, ensure text is selectable (not scanned images)", "Large documents are processed in chunks for comprehensive analysis"]
      },
      {
        heading: "Document Q&A",
        text: "After uploading a document, ask any question about its content. The AI will reference the document to provide accurate, contextual answers. You can ask for summaries, key points, specific data extraction, comparisons between sections, and more.",
      },
      {
        heading: "Image Analysis",
        text: "Upload images for visual analysis. The AI can describe images, extract text from screenshots, analyze charts and graphs, identify objects, and answer questions about visual content. This is powered by multimodal AI models.",
      },
      {
        heading: "Supported File Types",
        text: "PDF documents (text and scanned), PNG, JPG, GIF, and WebP images, plain text files (.txt), and various document formats. Maximum file size is 10MB per upload. Multiple files can be uploaded in a single conversation.",
      }
    ]
  },
  {
    id: "memory",
    title: "AI Memory",
    icon: Brain,
    badge: "Smart",
    content: [
      {
        heading: "How Memory Works",
        text: "OmePilot's Memory system learns from your conversations and stores important information like your preferences, project details, and frequently discussed topics. This enables the AI to provide increasingly personalized and contextual responses across all your chats.",
      },
      {
        heading: "Managing Memories",
        text: "Navigate to the Memory section from the sidebar to view, edit, categorize, or delete stored memories. Memories are organized by category (Personal, Work, Preferences, etc.) for easy management.",
        tips: ["Review your memories periodically to ensure accuracy", "Delete outdated information to keep context relevant", "Add custom memories for important project details"]
      },
      {
        heading: "Memory Categories",
        text: "Memories are automatically categorized into groups: Personal preferences, Work context, Technical knowledge, Project details, and Custom categories you create. This organization helps the AI apply the right context at the right time.",
      },
      {
        heading: "Privacy & Control",
        text: "You have complete control over your memory data. All memories can be viewed, edited, or permanently deleted at any time. Memory data is encrypted and never shared with other users or used for model training.",
      }
    ]
  },
  {
    id: "collaboration",
    title: "Team Collaboration",
    icon: Users,
    content: [
      {
        heading: "Starting a Collaborative Session",
        text: "Transform any conversation into a collaborative workspace by clicking the Users icon. Generate a shareable invite link and send it to team members. Up to 10 users can collaborate simultaneously in a single session.",
      },
      {
        heading: "Real-time Features",
        text: "See who's online with live presence indicators, get instant notifications when members join or send messages, and watch responses stream in real-time. All participants can interact with the AI and each other seamlessly.",
        tips: ["Use @mentions to notify specific team members", "Pin important messages for the whole team to see"]
      },
      {
        heading: "Roles & Permissions",
        text: "The conversation owner has full control and can assign roles to members: Admin (full control), Editor (can send messages and manage content), and Viewer (read-only access). Manage permissions from the session settings.",
      },
      {
        heading: "Sharing Conversations",
        text: "Share any conversation via a unique link. Recipients can view the full conversation history without needing an account. You can revoke access at any time by disabling the share link from the conversation menu.",
      }
    ]
  },
  {
    id: "search",
    title: "Web Search",
    icon: Globe,
    content: [
      {
        heading: "AI-Powered Web Search",
        text: "Use OmePilot's integrated web search to find current information from across the internet. The AI will search, summarize, and present relevant results with source citations, saving you time switching between tools.",
        tips: ["Ask specific questions for more targeted search results", "The AI will cite sources so you can verify information"]
      },
      {
        heading: "Search Integration",
        text: "Web search results are seamlessly integrated into your conversation context. The AI can combine search results with your uploaded documents and conversation history to provide comprehensive, well-researched answers.",
      }
    ]
  },
  {
    id: "quiz",
    title: "Quiz Generation",
    icon: BookOpen,
    content: [
      {
        heading: "Creating Quizzes",
        text: "Navigate to the Quiz section, upload a document or paste text, and the AI will automatically generate multiple-choice questions based on the content. Perfect for studying, training, and knowledge assessment.",
        tips: ["Upload study materials to auto-generate practice quizzes", "Customize difficulty level and number of questions"]
      },
      {
        heading: "Taking Quizzes",
        text: "Answer generated questions and receive instant feedback with detailed explanations for each answer. Track your scores over time and identify areas for improvement. Quiz results contribute to your leaderboard points.",
      },
      {
        heading: "Quiz Analytics",
        text: "Review your quiz performance with detailed analytics: overall accuracy, time per question, topic strengths and weaknesses, and progress over time. Use these insights to focus your learning efforts.",
      }
    ]
  },
  {
    id: "code-generation",
    title: "Code Generation",
    icon: Code,
    badge: "Dev",
    content: [
      {
        heading: "Writing Code",
        text: "Ask the AI to write code in any programming language. OmePilot supports syntax highlighting, code formatting, and can generate complete functions, classes, or entire modules based on your specifications.",
        tips: ["Specify the programming language and framework", "Provide example inputs/outputs for better results", "Ask for code explanations alongside generated code"]
      },
      {
        heading: "Code Review & Debugging",
        text: "Paste your code and ask the AI to review it for bugs, performance issues, security vulnerabilities, and best practices. Get detailed feedback with suggested improvements and explanations.",
      }
    ]
  },
  {
    id: "image-generation",
    title: "Image Generation",
    icon: Image,
    content: [
      {
        heading: "Creating Images",
        text: "Generate images from text descriptions using AI image generation. Describe what you want to see and the AI will create it. Useful for concept art, mockups, illustrations, and creative projects.",
      },
      {
        heading: "Image Editing",
        text: "Modify generated or uploaded images with text instructions. Ask the AI to change colors, add elements, adjust composition, or apply styles to existing images.",
      }
    ]
  },
  {
    id: "voice",
    title: "Voice & TTS",
    icon: Mic,
    content: [
      {
        heading: "Voice Transcription",
        text: "Use the microphone button to dictate messages instead of typing. OmePilot uses advanced speech recognition to accurately transcribe your voice input in real-time, supporting multiple languages.",
      },
      {
        heading: "Text-to-Speech",
        text: "Have AI responses read aloud with natural-sounding text-to-speech. Click the speaker icon on any message to hear it spoken. Choose from multiple voice options in Settings.",
      }
    ]
  },
  {
    id: "dashboard",
    title: "Dashboard & Analytics",
    icon: BarChart3,
    content: [
      {
        heading: "Usage Dashboard",
        text: "The Dashboard provides a comprehensive overview of your OmePilot usage: total conversations, messages sent, documents analyzed, quizzes completed, and activity trends over time. Monitor your productivity and engagement.",
      },
      {
        heading: "Leaderboard",
        text: "Compete with other users on the global leaderboard. Earn points by sending messages, creating conversations, completing quizzes, and maintaining activity streaks. Unlock badges for reaching milestones.",
      },
      {
        heading: "Activity Streaks",
        text: "Build daily activity streaks by using OmePilot consistently. Your current and longest streaks are tracked and displayed on your profile. Longer streaks earn bonus points and special badges.",
      }
    ]
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    content: [
      {
        heading: "Notification Center",
        text: "Access all your notifications from the bell icon in the sidebar. Notifications include collaborative session invites, mention alerts, system updates, and achievement unlocks.",
      },
      {
        heading: "Notification Settings",
        text: "Customize which notifications you receive from Settings. Enable or disable email notifications, sound alerts, and specific notification types to match your preferences.",
      }
    ]
  },
  {
    id: "subscription",
    title: "Plans & Billing",
    icon: CreditCard,
    content: [
      {
        heading: "Free Plan",
        text: "Get started with OmePilot for free. The Free plan includes basic AI chat, limited document uploads, and access to the community features. Perfect for individual users exploring the platform.",
      },
      {
        heading: "Pro Plan — $19/month",
        text: "Unlock the full power of OmePilot with Pro. Get unlimited conversations, all AI models, priority response times, unlimited document analysis, advanced memory features, and priority support.",
        tips: ["Upgrade anytime from the Manage Subscription dialog", "Cancel or change plans through the billing portal"]
      },
      {
        heading: "Billing Management",
        text: "Manage your subscription, update payment methods, view invoices, and change plans through the secure billing portal. Access it from Settings or the Manage Subscription dialog.",
      }
    ]
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    icon: Settings,
    content: [
      {
        heading: "Essential Shortcuts",
        text: "Master these keyboard shortcuts to boost your productivity with OmePilot:",
        tips: [
          "Ctrl/Cmd + N — Start a new conversation",
          "Enter — Send message",
          "Shift + Enter — New line in message",
          "Ctrl/Cmd + B — Toggle sidebar",
          "Ctrl/Cmd + K — Quick search",
          "? — Show all keyboard shortcuts",
          "Escape — Close dialogs and panels"
        ]
      }
    ]
  },
  {
    id: "privacy",
    title: "Privacy & Security",
    icon: Shield,
    content: [
      {
        heading: "Data Encryption",
        text: "All data transmitted between your browser and OmePilot servers is encrypted using TLS 1.3. Data at rest is encrypted using AES-256 encryption. Your conversations and documents are stored securely and only accessible by you.",
      },
      {
        heading: "Authentication Security",
        text: "OmePilot uses industry-standard authentication with secure password hashing, email verification, and session management. Passwords are never stored in plain text. Sessions are automatically invalidated after periods of inactivity.",
      },
      {
        heading: "Sharing Controls",
        text: "When you share a conversation, a unique cryptographic token is generated. You maintain full control — revoke access at any time by disabling the share link. Shared conversations are read-only for recipients.",
      },
      {
        heading: "Data Retention",
        text: "Your data is retained as long as your account is active. You can delete individual conversations, memories, or your entire account at any time. Deleted data is permanently removed from our servers within 30 days.",
      },
      {
        heading: "Compliance",
        text: "OmePilot is designed with privacy-first principles. We do not sell user data, do not use conversations for AI model training, and comply with GDPR and other applicable data protection regulations.",
      }
    ]
  },
  {
    id: "api",
    title: "API & Integrations",
    icon: Terminal,
    badge: "Advanced",
    content: [
      {
        heading: "Edge Functions",
        text: "OmePilot uses serverless edge functions for AI processing, document analysis, web search, and more. These functions run close to users for minimal latency and scale automatically with demand.",
      },
      {
        heading: "Sharing API",
        text: "Shared conversations are accessible via unique URLs with cryptographic tokens. This API enables embedding conversation views in external applications and websites.",
      },
      {
        heading: "Plugin System",
        text: "Extend OmePilot's functionality with custom plugins. Create, publish, and discover community-built plugins from the Creator Gallery. Plugins can add new AI capabilities, integrations, and workflows.",
      }
    ]
  },
];

export default function DocumentationPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = searchQuery.trim()
    ? sections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.some(c =>
          c.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.text.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : sections;

  const activeData = sections.find(s => s.id === activeSection);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar nav */}
        <div className="w-60 border-r border-border bg-muted/30 hidden md:block flex-shrink-0">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5 text-primary" />
              Documentation
            </h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background border-border"
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-105px)]">
            <nav className="p-2 space-y-0.5">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => { setActiveSection(section.id); setSearchQuery(""); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    activeSection === section.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <section.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 truncate">{section.title}</span>
                  {section.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {section.badge}
                    </Badge>
                  )}
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

            {activeData && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <activeData.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">{activeData.title}</h1>
                      {activeData.badge && (
                        <Badge variant="secondary" className="text-xs">{activeData.badge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activeData.content.length} {activeData.content.length === 1 ? 'topic' : 'topics'} in this section
                    </p>
                  </div>
                </div>

                <div className="space-y-5 mt-6">
                  {activeData.content.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-border bg-card p-5 hover:border-primary/20 transition-colors">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                        {item.heading}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed ml-6">{item.text}</p>
                      {item.tips && item.tips.length > 0 && (
                        <div className="mt-3 ml-6 rounded-lg bg-primary/5 border border-primary/10 p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Lightbulb className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium text-primary">Tips</span>
                          </div>
                          <ul className="space-y-1">
                            {item.tips.map((tip, tidx) => (
                              <li key={tidx} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
                  {(() => {
                    const currentIdx = sections.findIndex(s => s.id === activeSection);
                    const prev = currentIdx > 0 ? sections[currentIdx - 1] : null;
                    const next = currentIdx < sections.length - 1 ? sections[currentIdx + 1] : null;
                    return (
                      <>
                        {prev ? (
                          <button onClick={() => setActiveSection(prev.id)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            ← {prev.title}
                          </button>
                        ) : <div />}
                        {next ? (
                          <button onClick={() => setActiveSection(next.id)} className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                            {next.title} →
                          </button>
                        ) : <div />}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
