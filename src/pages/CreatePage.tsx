import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";

export default function CreatePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pageTitle, setPageTitle] = useState("");
  const [pageContent, setPageContent] = useState("");

  const handleCreatePage = () => {
    if (!pageTitle.trim()) {
      toast.error("Please enter a page title");
      return;
    }
    toast.success("Page creation coming soon!");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-semibold text-foreground flex items-center gap-3">
              <FileText className="h-8 w-8" />
              Create New Page
            </h1>
            <p className="text-muted-foreground mt-2">
              Design and create custom pages for your Omepilot experience
            </p>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Page Title
              </label>
              <Input
                placeholder="Enter page title..."
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="bg-card border-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Page Description
              </label>
              <Textarea
                placeholder="Describe what this page will do..."
                value={pageContent}
                onChange={(e) => setPageContent(e.target.value)}
                className="bg-card border-input min-h-[200px]"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCreatePage} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Page
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
            </div>

            <div className="border border-border rounded-lg p-6 bg-card/50">
              <h3 className="font-semibold mb-3 text-foreground">Preview</h3>
              <div className="space-y-2">
                <div className="text-xl font-semibold text-foreground">
                  {pageTitle || "Untitled Page"}
                </div>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {pageContent || "No description provided"}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
