import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Trash2, Edit2, Check, X, Pin, Share2, MoreHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConversationItemProps {
  id: string;
  title: string;
  isPinned?: boolean;
  shareToken?: string | null;
  onDelete: () => void;
  onUpdate: () => void;
}

export const ConversationItem = ({ 
  id, 
  title, 
  isPinned = false,
  shareToken,
  onDelete, 
  onUpdate 
}: ConversationItemProps) => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isActive = conversationId === id;

  const handleClick = () => {
    if (!isEditing) {
      navigate(`/chat/${id}`);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', id);

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Conversation deleted');
      onDelete();
      
      if (isActive) {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: editTitle.trim() })
        .eq('id', id);

      if (error) throw error;

      toast.success('Title updated');
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title');
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(title);
    setIsEditing(false);
  };

  const handlePin = async () => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_pinned: !isPinned })
        .eq('id', id);

      if (error) throw error;

      toast.success(isPinned ? 'Unpinned' : 'Pinned');
      onUpdate();
    } catch (error: any) {
      console.error('Error pinning conversation:', error);
      toast.error('Failed to pin conversation');
    }
  };

  const handleShare = async () => {
    try {
      let token = shareToken;
      
      if (!token) {
        // Generate new share token
        token = crypto.randomUUID();
        const { error } = await supabase
          .from('conversations')
          .update({ share_token: token })
          .eq('id', id);

        if (error) throw error;
        onUpdate();
      }

      const shareUrl = `${window.location.origin}/chat/${id}?share=${token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard');
    } catch (error: any) {
      console.error('Error sharing conversation:', error);
      toast.error('Failed to share conversation');
    }
  };

  return (
    <>
      <div
        className={`group relative flex items-center gap-2 px-2.5 py-2.5 mx-1 rounded-lg cursor-pointer transition-all ${
          isActive 
            ? 'bg-primary/10 text-primary' 
            : 'hover:bg-muted/70 text-foreground/80'
        }`}
        onClick={handleClick}
      >
        <div className="relative flex-shrink-0">
          <MessageSquare className="h-4 w-4 opacity-60" />
          {isPinned && (
            <Pin className="absolute -top-1 -right-1 h-2.5 w-2.5 text-primary fill-primary" />
          )}
        </div>
        
        {isEditing ? (
          <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-7 text-xs bg-background px-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
              className="h-6 w-6 rounded hover:bg-primary/20"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
              className="h-6 w-6 rounded hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <span className="flex-1 truncate text-sm">{title}</span>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePin(); }}>
                  <Pin className={`h-4 w-4 mr-2 ${isPinned ? 'fill-current' : ''}`} />
                  {isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShare(); }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};