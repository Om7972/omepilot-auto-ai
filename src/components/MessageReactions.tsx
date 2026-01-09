import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SmilePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "💡"];

export const MessageReactions = ({ messageId }: MessageReactionsProps) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadReactions();
    getCurrentUser();

    // Subscribe to reaction changes
    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
        filter: `message_id=eq.${messageId}`
      }, () => {
        loadReactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadReactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('message_reactions')
        .select('emoji, user_id')
        .eq('message_id', messageId);

      if (error) throw error;

      // Group reactions by emoji
      const grouped = (data || []).reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: [],
            hasReacted: false,
          };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.user_id);
        if (user && reaction.user_id === user.id) {
          acc[reaction.emoji].hasReacted = true;
        }
        return acc;
      }, {} as Record<string, Reaction>);

      setReactions(Object.values(grouped));
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const toggleReaction = async (emoji: string) => {
    if (!currentUserId) {
      toast.error('Please log in to react');
      return;
    }

    const existingReaction = reactions.find(r => r.emoji === emoji && r.hasReacted);

    try {
      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', currentUserId)
          .eq('emoji', emoji);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUserId,
            emoji,
          });

        if (error) throw error;
      }

      setIsOpen(false);
    } catch (error: any) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.div
            key={reaction.emoji}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleReaction(reaction.emoji)}
                  className={`h-7 px-2 gap-1 text-xs rounded-full ${
                    reaction.hasReacted 
                      ? 'bg-primary/20 text-primary border border-primary/30' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-sm">{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{reaction.count} {reaction.count === 1 ? 'person' : 'people'} reacted</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ))}
      </AnimatePresence>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <SmilePlus className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="icon"
                onClick={() => toggleReaction(emoji)}
                className="h-8 w-8 text-lg hover:bg-muted rounded-full"
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
