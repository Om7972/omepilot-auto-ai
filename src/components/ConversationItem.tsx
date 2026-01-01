import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
      // Delete messages first
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

  return (
    <>
      <div
        className={`group relative flex items-center gap-2 px-2.5 py-2 mx-1 rounded-lg cursor-pointer transition-all ${
          isActive 
            ? 'bg-primary/10 text-primary' 
            : 'hover:bg-muted/70 text-foreground/80'
        }`}
        onClick={handleClick}
      >
        <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
        
        {isEditing ? (
          <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-6 text-xs bg-background px-1.5"
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
              className="h-5 w-5 rounded hover:bg-primary/20"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
              className="h-5 w-5 rounded hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <span className="flex-1 truncate text-xs">{title}</span>
            
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="h-5 w-5 rounded hover:bg-muted"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                className="h-5 w-5 rounded hover:bg-destructive/20 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
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