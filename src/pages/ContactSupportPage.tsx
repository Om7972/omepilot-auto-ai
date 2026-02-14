import { Sidebar } from "@/components/Sidebar";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Mail, Clock, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ContactSupportPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitted(true);
    toast.success("Support request submitted!");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto p-6 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Contact Support</h1>
              <p className="text-sm text-muted-foreground">We're here to help</p>
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Email Support</p>
                <p className="text-xs text-muted-foreground">support@omepilot.com</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Response Time</p>
                <p className="text-xs text-muted-foreground">Usually within 24 hours</p>
              </div>
            </div>
          </div>

          {submitted ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Request Submitted</h2>
              <p className="text-muted-foreground text-sm mb-6">
                We've received your support request and will get back to you within 24 hours.
              </p>
              <Button onClick={() => { setSubmitted(false); setSubject(""); setCategory(""); setMessage(""); }}>
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="account">Account Issue</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject *</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message *</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={6}
                />
              </div>

              <Button type="submit" className="w-full gap-2">
                <Send className="h-4 w-4" />
                Submit Request
              </Button>
            </form>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
