import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConversationItemProps {
  id: string;
  title: string;
  onDelete: () => void;
  onUpdate: () => void;
}

export const ConversationItem = ({ id, title, onDelete, onUpdate }: ConversationItemProps) => {
  const { conversationId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isActive = conversationId === id;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Conversation deleted');
      onDelete();
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

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="h-8 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit();
            if (e.key === 'Escape') handleCancelEdit();
          }}
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSaveEdit}
          className="h-8 w-8 flex-shrink-0"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCancelEdit}
          className="h-8 w-8 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="group relative">
        <Link to={`/chat/${id}`} className="block">
          <Button
            variant={isActive ? "secondary" : "ghost"}
            className="w-full justify-start gap-3 hover:bg-sidebar-accent text-left pr-20"
          >
            <MessageSquare className="h-4 w-4 flex-shrink-0" />
            <span className="truncate flex-1">{title}</span>
          </Button>
        </Link>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="h-7 w-7 hover:bg-sidebar-accent"
            title="Edit conversation title"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
            title="Delete conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
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
