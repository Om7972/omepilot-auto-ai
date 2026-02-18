import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Check, Globe, Lock, Link2, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  shareToken?: string | null;
  onUpdate: () => void;
}

export const ShareDialog = ({
  open,
  onOpenChange,
  conversationId,
  shareToken,
  onUpdate,
}: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(!!shareToken);
  const [isLoading, setIsLoading] = useState(false);

  const shareUrl = shareToken
    ? `${window.location.origin}/shared/${conversationId}?token=${shareToken}`
    : "";

  const handleTogglePublic = async () => {
    setIsLoading(true);
    try {
      if (isPublic) {
        // Remove share token
        const { error } = await supabase
          .from("conversations")
          .update({ share_token: null })
          .eq("id", conversationId);

        if (error) throw error;
        setIsPublic(false);
        toast.success("Link sharing disabled");
      } else {
        // Generate new share token
        const token = crypto.randomUUID();
        const { error } = await supabase
          .from("conversations")
          .update({ share_token: token })
          .eq("id", conversationId);

        if (error) throw error;
        setIsPublic(true);
        toast.success("Link sharing enabled");
      }
      onUpdate();
    } catch (error) {
      console.error("Error toggling share:", error);
      toast.error("Failed to update sharing settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleCreateLink = async () => {
    setIsLoading(true);
    try {
      const token = crypto.randomUUID();
      const { error } = await supabase
        .from("conversations")
        .update({ share_token: token })
        .eq("id", conversationId);

      if (error) throw error;
      setIsPublic(true);
      onUpdate();
      toast.success("Share link created");
    } catch (error) {
      console.error("Error creating share link:", error);
      toast.error("Failed to create share link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Share Conversation
          </DialogTitle>
          <DialogDescription>
            Share this conversation with others via a link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Link Sharing Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="h-5 w-5 text-primary" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label className="text-sm font-medium">
                  {isPublic ? "Anyone with link" : "Private"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Anyone with the link can view this conversation"
                    : "Only you can access this conversation"}
                </p>
              </div>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              disabled={isLoading}
            />
          </div>

          {/* Share Link */}
          {isPublic && shareUrl ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Share link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-sm bg-muted/30"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : !isPublic ? (
            <Button
              onClick={handleCreateLink}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Create share link
            </Button>
          ) : null}

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-1">Note:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Shared conversations are read-only for viewers</li>
              <li>You can revoke access anytime by disabling sharing</li>
              <li>New messages will be visible to anyone with the link</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
