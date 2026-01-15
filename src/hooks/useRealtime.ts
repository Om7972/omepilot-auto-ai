import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface RealtimePayload<T> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
}

interface UseRealtimeOptions<T> {
  table: string;
  schema?: string;
  event?: PostgresChangeEvent;
  filter?: string;
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: { old: T; new: T }) => void;
  onDelete?: (payload: T) => void;
  onChange?: (payload: RealtimePayload<T>) => void;
  enabled?: boolean;
}

export function useRealtime<T>({
  table,
  schema = "public",
  event = "*",
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: UseRealtimeOptions<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    const channelName = `realtime-${table}-${filter || "all"}-${Date.now()}`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelConfig: any = {
      event,
      schema,
      table,
    };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as const,
        channelConfig,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const typedPayload = payload as RealtimePayload<T>;
          onChange?.(typedPayload);

          switch (typedPayload.eventType) {
            case "INSERT":
              onInsert?.(typedPayload.new);
              break;
            case "UPDATE":
              onUpdate?.({ old: typedPayload.old, new: typedPayload.new });
              break;
            case "DELETE":
              onDelete?.(typedPayload.old);
              break;
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return cleanup;
  }, [table, schema, event, filter, enabled, onInsert, onUpdate, onDelete, onChange, cleanup]);

  return { cleanup };
}

interface Message {
  id: string;
  conversation_id: string;
  user_id: string | null;
  role: string;
  content: string;
  created_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
}

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// Specific hook for messages
export function useRealtimeMessages(
  conversationId: string | undefined,
  callbacks: {
    onNewMessage?: (message: Message) => void;
    onMessageUpdate?: (payload: { old: Message; new: Message }) => void;
    onMessageDelete?: (message: Message) => void;
  }
) {
  return useRealtime<Message>({
    table: "messages",
    filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
    enabled: !!conversationId,
    onInsert: callbacks.onNewMessage,
    onUpdate: callbacks.onMessageUpdate,
    onDelete: callbacks.onMessageDelete,
  });
}

// Specific hook for notifications
export function useRealtimeNotifications(
  userId: string | undefined,
  onNewNotification?: (notification: Notification) => void
) {
  return useRealtime<Notification>({
    table: "notifications",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onInsert: onNewNotification,
  });
}

// Specific hook for conversations
export function useRealtimeConversations(
  userId: string | undefined,
  callbacks: {
    onNewConversation?: (conversation: Conversation) => void;
    onConversationUpdate?: (payload: { old: Conversation; new: Conversation }) => void;
    onConversationDelete?: (conversation: Conversation) => void;
  }
) {
  return useRealtime<Conversation>({
    table: "conversations",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onInsert: callbacks.onNewConversation,
    onUpdate: callbacks.onConversationUpdate,
    onDelete: callbacks.onConversationDelete,
  });
}
