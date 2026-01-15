import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeConversations } from "./useRealtime";
import { toast } from "sonner";

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_collaborative: boolean;
  is_pinned: boolean;
  share_token: string | null;
}

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: Error | null;
  createConversation: (title?: string) => Promise<Conversation | null>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<boolean>;
  deleteConversation: (id: string) => Promise<boolean>;
  pinConversation: (id: string, pinned: boolean) => Promise<boolean>;
  shareConversation: (id: string) => Promise<string | null>;
  refresh: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("conversations")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching conversations:", fetchError);
        setError(new Error(fetchError.message));
        return;
      }

      setConversations(data as Conversation[]);
      setError(null);
    } catch (err) {
      console.error("Error in fetchConversations:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Real-time subscription
  useRealtimeConversations(user?.id, {
    onNewConversation: (newConversation) => {
      setConversations((prev) => [newConversation as unknown as Conversation, ...prev]);
    },
    onConversationUpdate: ({ new: updated }) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? (updated as unknown as Conversation) : c))
      );
    },
    onConversationDelete: (deleted) => {
      setConversations((prev) => prev.filter((c) => c.id !== deleted.id));
    },
  });

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = useCallback(async (title?: string): Promise<Conversation | null> => {
    if (!user?.id) {
      toast.error("You must be logged in to create a conversation");
      return null;
    }

    try {
      const { data, error: createError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: title || "New Conversation",
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating conversation:", createError);
        toast.error("Failed to create conversation");
        return null;
      }

      return data as Conversation;
    } catch (err) {
      console.error("Error in createConversation:", err);
      toast.error("Failed to create conversation");
      return null;
    }
  }, [user?.id]);

  const updateConversation = useCallback(async (
    id: string,
    updates: Partial<Conversation>
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("conversations")
        .update(updates)
        .eq("id", id);

      if (updateError) {
        console.error("Error updating conversation:", updateError);
        toast.error("Failed to update conversation");
        return false;
      }

      return true;
    } catch (err) {
      console.error("Error in updateConversation:", err);
      toast.error("Failed to update conversation");
      return false;
    }
  }, []);

  const deleteConversation = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Error deleting conversation:", deleteError);
        toast.error("Failed to delete conversation");
        return false;
      }

      toast.success("Conversation deleted");
      return true;
    } catch (err) {
      console.error("Error in deleteConversation:", err);
      toast.error("Failed to delete conversation");
      return false;
    }
  }, []);

  const pinConversation = useCallback(async (id: string, pinned: boolean): Promise<boolean> => {
    const success = await updateConversation(id, { is_pinned: pinned });
    if (success) {
      toast.success(pinned ? "Conversation pinned" : "Conversation unpinned");
    }
    return success;
  }, [updateConversation]);

  const shareConversation = useCallback(async (id: string): Promise<string | null> => {
    try {
      // Generate a share token using the database function
      const { data: tokenData, error: tokenError } = await supabase
        .rpc("generate_share_token");

      if (tokenError) {
        console.error("Error generating share token:", tokenError);
        toast.error("Failed to generate share link");
        return null;
      }

      const { error: updateError } = await supabase
        .from("conversations")
        .update({ 
          share_token: tokenData,
          is_collaborative: true 
        })
        .eq("id", id);

      if (updateError) {
        console.error("Error updating conversation:", updateError);
        toast.error("Failed to share conversation");
        return null;
      }

      const shareUrl = `${window.location.origin}/chat/${id}?token=${tokenData}`;
      toast.success("Share link generated!");
      return shareUrl;
    } catch (err) {
      console.error("Error in shareConversation:", err);
      toast.error("Failed to share conversation");
      return null;
    }
  }, []);

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    pinConversation,
    shareConversation,
    refresh: fetchConversations,
  };
}
