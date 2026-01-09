import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pin, X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface PinnedMessage {
  id: string;
  content: string;
  role: string;
  created_at: string;
  pinned_at: string;
}

interface PinnedMessagesProps {
  conversationId: string;
  onUnpin: (messageId: string) => void;
}

export const PinnedMessages = ({ conversationId, onUnpin }: PinnedMessagesProps) => {
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!conversationId) return;
    
    loadPinnedMessages();

    // Subscribe to changes
    const channel = supabase
      .channel(`pinned-${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, () => {
        loadPinnedMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const loadPinnedMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, role, created_at, pinned_at')
      .eq('conversation_id', conversationId)
      .eq('is_pinned', true)
      .order('pinned_at', { ascending: false });

    if (!error && data) {
      setPinnedMessages(data as PinnedMessage[]);
    }
  };

  if (pinnedMessages.length === 0) return null;

  return (
    <div className="border-b border-border bg-muted/30 backdrop-blur-sm">
      <div 
        className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {pinnedMessages.length} Pinned Message{pinnedMessages.length > 1 ? 's' : ''}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ScrollArea className="max-h-32">
              <div className="px-4 pb-3 space-y-2">
                {pinnedMessages.map((message) => (
                  <div 
                    key={message.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-background/50 border border-border/50 group"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-muted-foreground">
                        {message.role === 'user' ? 'You' : 'Omepilot'}
                      </span>
                      <p className="text-sm truncate">{message.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnpin(message.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
