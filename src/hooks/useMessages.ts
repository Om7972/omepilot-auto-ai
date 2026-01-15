import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeMessages } from "./useRealtime";
import { toast } from "sonner";

interface Message {
  id: string;
  conversation_id: string;
  user_id: string | null;
  role: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  attachments: Record<string, unknown>[];
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  sendMessage: (content: string, role?: string, attachments?: Record<string, unknown>[]) => Promise<Message | null>;
  deleteMessage: (id: string) => Promise<boolean>;
  pinMessage: (id: string, pinned: boolean) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useMessages(conversationId: string | undefined): UseMessagesReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        console.error("Error fetching messages:", fetchError);
        setError(new Error(fetchError.message));
        return;
      }

      setMessages(data as Message[]);
      setError(null);
    } catch (err) {
      console.error("Error in fetchMessages:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Real-time subscription
  useRealtimeMessages(conversationId, {
    onNewMessage: (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage as unknown as Message];
      });
    },
    onMessageUpdate: ({ new: updated }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? (updated as unknown as Message) : m))
      );
    },
    onMessageDelete: (deleted) => {
      setMessages((prev) => prev.filter((m) => m.id !== deleted.id));
    },
  });

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = useCallback(async (
    content: string,
    role: string = "user",
    attachments: Record<string, unknown>[] = []
  ): Promise<Message | null> => {
    if (!conversationId) {
      toast.error("No conversation selected");
      return null;
    }

    try {
      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          user_id: user?.id || null,
          role,
          content,
          attachments: attachments as unknown as ReturnType<typeof JSON.parse>,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error sending message:", insertError);
        toast.error("Failed to send message");
        return null;
      }

      return data as Message;
    } catch (err) {
      console.error("Error in sendMessage:", err);
      toast.error("Failed to send message");
      return null;
    }
  }, [conversationId, user?.id]);

  const deleteMessage = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from("messages")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Error deleting message:", deleteError);
        toast.error("Failed to delete message");
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error in deleteMessage:", err);
      toast.error("Failed to delete message");
      return false;
    }
  }, []);

  const pinMessage = useCallback(async (id: string, pinned: boolean): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("messages")
        .update({
          is_pinned: pinned,
          pinned_at: pinned ? new Date().toISOString() : null,
          pinned_by: pinned ? user?.id : null,
        })
        .eq("id", id);

      if (updateError) {
        console.error("Error pinning message:", updateError);
        toast.error("Failed to pin message");
        return false;
      }

      toast.success(pinned ? "Message pinned" : "Message unpinned");
      return true;
    } catch (err) {
      console.error("Error in pinMessage:", err);
      toast.error("Failed to pin message");
      return false;
    }
  }, [user?.id]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    pinMessage,
    refresh: fetchMessages,
  };
}
