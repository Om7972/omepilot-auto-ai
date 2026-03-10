import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  MessageCircle, Mail, Clock, Send, CheckCircle2, Phone, Globe, 
  HelpCircle, FileText, Shield, Zap, BookOpen, AlertTriangle, Bug,
  CreditCard, Users, Settings, Lightbulb, ArrowRight, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const faqs = [
  {
    question: "How do I reset my password?",
    answer: "Go to the login page and click 'Forgot Password'. Enter your email address and follow the instructions in the password reset email. If you don't receive the email within 5 minutes, check your spam folder."
  },
  {
    question: "Can I export my conversations?",
    answer: "Yes! Open any conversation, click the menu icon, and select 'Export'. You can export as PDF or plain text. All messages, timestamps, and attachments are included in the export."
  },
  {
    question: "How do I upgrade to Pro?",
    answer: "Click on your profile in the sidebar, select 'Manage Subscription', and click 'Upgrade' on the Pro plan. You'll be redirected to our secure payment portal. Pro benefits activate immediately after payment."
  },
  {
    question: "What AI models are available?",
    answer: "OmePilot offers GPT-5, GPT-5 Mini, Gemini Pro, Gemini Flash, and more. Free users have access to select models, while Pro users can access all models including the most powerful options."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We never sell user data or use conversations for model training. You can delete your data at any time."
  },
  {
    question: "How does collaboration work?",
    answer: "Open any conversation and click the Users icon to enable collaborative mode. Share the generated link with up to 10 team members. Everyone can interact with the AI in real-time with live presence indicators."
  },
  {
    question: "What file types can I upload?",
    answer: "OmePilot supports PDF documents, images (PNG, JPG, GIF, WebP), and text files. Maximum file size is 10MB per upload. The AI will automatically extract and analyze the content."
  },
  {
    question: "How do I cancel my subscription?",
    answer: "Go to Manage Subscription and click 'Manage Billing'. In the billing portal, you can cancel your subscription. You'll retain Pro access until the end of your current billing period."
  },
];

const supportChannels = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us a detailed message",
    detail: "support@omepilot.com",
    badge: "24h response",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our support team",
    detail: "Available Mon-Fri, 9am-6pm EST",
    badge: "Fastest",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Browse our comprehensive docs",
    detail: "Self-service knowledge base",
    badge: "Instant",
  },
  {
    icon: Globe,
    title: "Community",
    description: "Join our community forum",
    detail: "Get help from other users",
    badge: null,
  },
];

export default function ContactSupportPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitted(true);
    toast.success("Support request submitted!");
  };

  const resetForm = () => {
    setSubmitted(false);
    setName("");
    setEmail("");
    setSubject("");
    setCategory("");
    setPriority("");
    setMessage("");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6 md:p-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Help & Support</h1>
              <p className="text-sm text-muted-foreground">Get the help you need, when you need it</p>
            </div>
          </div>

          {/* Support Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8 mb-10">
            {supportChannels.map((channel, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (channel.title === "Documentation") navigate("/documentation");
                }}
                className="rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <channel.icon className="h-4 w-4 text-primary" />
                  </div>
                  {channel.badge && (
                    <Badge variant="secondary" className="text-[10px]">{channel.badge}</Badge>
                  )}
                </div>
                <p className="font-semibold text-sm mb-0.5">{channel.title}</p>
                <p className="text-xs text-muted-foreground mb-1">{channel.description}</p>
                <p className="text-xs text-primary/80">{channel.detail}</p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Support Form */}
            <div className="lg:col-span-3">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Submit a Request
              </h2>

              {submitted ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Request Submitted</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    We've received your support request and a confirmation has been sent to your email.
                  </p>
                  <p className="text-muted-foreground text-xs mb-6">
                    Ticket ID: <span className="font-mono text-foreground">#{Math.random().toString(36).substring(2, 10).toUpperCase()}</span> • Expected response within 24 hours
                  </p>
                  <Button onClick={resetForm}>Submit Another Request</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Your Name</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Category</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bug"><div className="flex items-center gap-2"><Bug className="h-3.5 w-3.5" /> Bug Report</div></SelectItem>
                          <SelectItem value="feature"><div className="flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5" /> Feature Request</div></SelectItem>
                          <SelectItem value="account"><div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Account Issue</div></SelectItem>
                          <SelectItem value="billing"><div className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Billing</div></SelectItem>
                          <SelectItem value="security"><div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Security</div></SelectItem>
                          <SelectItem value="performance"><div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5" /> Performance</div></SelectItem>
                          <SelectItem value="other"><div className="flex items-center gap-2"><HelpCircle className="h-3.5 w-3.5" /> Other</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Priority</label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low — General question</SelectItem>
                          <SelectItem value="medium">Medium — Issue but workaround exists</SelectItem>
                          <SelectItem value="high">High — Major feature broken</SelectItem>
                          <SelectItem value="critical">Critical — Cannot use the app</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Subject *</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Description *</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe your issue in detail. Include steps to reproduce, expected behavior, and what actually happened..."
                      rows={6}
                    />
                  </div>

                  <div className="rounded-lg bg-muted/50 border border-border p-3">
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      For security issues, please do not include sensitive information like passwords or API keys in your message.
                    </p>
                  </div>

                  <Button type="submit" className="w-full gap-2">
                    <Send className="h-4 w-4" />
                    Submit Request
                  </Button>
                </form>
              )}
            </div>

            {/* FAQ Sidebar */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Frequently Asked Questions
              </h2>
              <div className="rounded-xl border border-border bg-card">
                <Accordion type="single" collapsible className="px-4">
                  {faqs.map((faq, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`}>
                      <AccordionTrigger className="text-sm text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-xs leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Quick Links */}
              <div className="mt-6 rounded-xl border border-border bg-card p-4">
                <h3 className="font-semibold text-sm mb-3">Quick Links</h3>
                <div className="space-y-2">
                  {[
                    { label: "Documentation", path: "/documentation", icon: BookOpen },
                    { label: "Settings", path: "/settings", icon: Settings },
                    { label: "Your Profile", path: "/profile", icon: Users },
                  ].map((link) => (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                      <ArrowRight className="h-3 w-3 ml-auto" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">All Systems Operational</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last checked: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
