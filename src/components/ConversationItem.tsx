import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Trash2, Edit2, Check, X, Pin, Share2, MoreHorizontal, Download, Users, Archive } from "lucide-react";
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
import { ShareDialog } from "./ShareDialog";
import { ExportChatDialog } from "./ExportChatDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConversationItemProps {
  id: string;
  title: string;
  isPinned?: boolean;
  isArchived?: boolean;
  shareToken?: string | null;
  onDelete: () => void;
  onUpdate: () => void;
}

export const ConversationItem = ({ 
  id, 
  title, 
  isPinned = false,
  isArchived = false,
  shareToken,
  onDelete, 
  onUpdate 
}: ConversationItemProps) => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
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

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleStartGroupChat = async () => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_collaborative: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Group chat enabled! Share the conversation to invite others.');
      navigate(`/chat/${id}`);
      onUpdate();
    } catch (error: any) {
      console.error('Error starting group chat:', error);
      toast.error('Failed to start group chat');
    }
  };

  const handleArchive = async () => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_archived: !isArchived } as any)
        .eq('id', id);

      if (error) throw error;

      toast.success(isArchived ? 'Conversation unarchived' : 'Conversation archived');
      onUpdate();
      
      if (isActive && !isArchived) {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error archiving conversation:', error);
      toast.error('Failed to update conversation');
    }
  };

  return (
    <>
      <div
        className={`group relative flex items-center gap-2 px-2.5 py-2.5 mx-1 rounded-lg cursor-pointer transition-all ${
          isActive 
            ? 'bg-primary/10 text-primary' 
            : isArchived
              ? 'hover:bg-muted/70 text-muted-foreground/60'
              : 'hover:bg-muted/70 text-foreground/80'
        }`}
        onClick={handleClick}
      >
        <div className="relative flex-shrink-0">
          {isArchived ? (
            <Archive className="h-4 w-4 opacity-50" />
          ) : (
            <MessageSquare className="h-4 w-4 opacity-60" />
          )}
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
                  className="h-6 w-6 rounded opacity-70 hover:opacity-100 transition-opacity hover:bg-muted"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShare(); }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartGroupChat(); }}>
                  <Users className="h-4 w-4 mr-2" />
                  Start a group chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePin(); }}>
                  <Pin className={`h-4 w-4 mr-2 ${isPinned ? 'fill-current' : ''}`} />
                  Pin chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(); }}>
                  <Archive className="h-4 w-4 mr-2" />
                  {isArchived ? 'Unarchive' : 'Archive'}
                </DropdownMenuItem>
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

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        conversationId={id}
        shareToken={shareToken}
        onUpdate={onUpdate}
      />

      <ExportChatDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        conversationId={id}
        conversationTitle={title}
      />
    </>
  );
};