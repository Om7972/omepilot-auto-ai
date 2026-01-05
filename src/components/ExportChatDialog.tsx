import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, FileText, FileJson, FileCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExportChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  conversationTitle?: string;
}

type ExportFormat = 'txt' | 'json' | 'md';

export const ExportChatDialog = ({
  open,
  onOpenChange,
  conversationId,
  conversationTitle = 'conversation',
}: ExportChatDialogProps) => {
  const [format, setFormat] = useState<ExportFormat>('txt');
  const [isExporting, setIsExporting] = useState(false);

  const exportChat = async () => {
    setIsExporting(true);
    try {
      // Fetch all messages for this conversation
      const { data: messages, error } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!messages || messages.length === 0) {
        toast.error('No messages to export');
        return;
      }

      let content = '';
      let filename = '';
      let mimeType = '';

      const sanitizedTitle = conversationTitle
        .replace(/[^a-z0-9]/gi, '_')
        .substring(0, 50);

      switch (format) {
        case 'txt':
          content = messages.map(msg => {
            const role = msg.role === 'user' ? 'You' : 'Omepilot';
            const time = new Date(msg.created_at).toLocaleString();
            return `[${time}] ${role}:\n${msg.content}\n`;
          }).join('\n---\n\n');
          filename = `${sanitizedTitle}_chat.txt`;
          mimeType = 'text/plain';
          break;

        case 'json':
          content = JSON.stringify({
            title: conversationTitle,
            exportedAt: new Date().toISOString(),
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.created_at,
            })),
          }, null, 2);
          filename = `${sanitizedTitle}_chat.json`;
          mimeType = 'application/json';
          break;

        case 'md':
          content = `# ${conversationTitle}\n\n`;
          content += `*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;
          content += messages.map(msg => {
            const role = msg.role === 'user' ? '**You**' : '**Omepilot**';
            const time = new Date(msg.created_at).toLocaleTimeString();
            return `### ${role} (${time})\n\n${msg.content}\n`;
          }).join('\n---\n\n');
          filename = `${sanitizedTitle}_chat.md`;
          mimeType = 'text/markdown';
          break;
      }

      // Create and download the file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Chat exported as ${format.toUpperCase()}`);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error exporting chat:', error);
      toast.error('Failed to export chat');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Chat History
          </DialogTitle>
          <DialogDescription>
            Choose a format to export your conversation
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="txt" id="txt" />
              <Label htmlFor="txt" className="flex items-center gap-3 cursor-pointer flex-1">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Plain Text (.txt)</p>
                  <p className="text-sm text-muted-foreground">Simple readable format</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer mt-2">
              <RadioGroupItem value="md" id="md" />
              <Label htmlFor="md" className="flex items-center gap-3 cursor-pointer flex-1">
                <FileCode className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Markdown (.md)</p>
                  <p className="text-sm text-muted-foreground">Formatted with headers and styling</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer mt-2">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json" className="flex items-center gap-3 cursor-pointer flex-1">
                <FileJson className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">JSON (.json)</p>
                  <p className="text-sm text-muted-foreground">Structured data for developers</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={exportChat} disabled={isExporting} className="gap-2">
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};