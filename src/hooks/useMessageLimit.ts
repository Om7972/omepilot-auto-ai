import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

const FREE_DAILY_LIMIT = 25;

interface MessageLimitState {
  messagesSentToday: number;
  remaining: number;
  limitReached: boolean;
  loading: boolean;
  dailyLimit: number;
}

export function useMessageLimit() {
  const { user } = useAuth();
  const { subscribed, loading: subLoading } = useSubscription();
  const [state, setState] = useState<MessageLimitState>({
    messagesSentToday: 0,
    remaining: FREE_DAILY_LIMIT,
    limitReached: false,
    loading: true,
    dailyLimit: FREE_DAILY_LIMIT,
  });

  const fetchTodayCount = useCallback(async () => {
    if (!user || subscribed) {
      setState({
        messagesSentToday: 0,
        remaining: Infinity,
        limitReached: false,
        loading: false,
        dailyLimit: Infinity,
      });
      return;
    }

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "user")
        .gte("created_at", todayStart.toISOString());

      if (error) {
        console.error("Error fetching message count:", error);
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const sent = count ?? 0;
      const remaining = Math.max(0, FREE_DAILY_LIMIT - sent);

      setState({
        messagesSentToday: sent,
        remaining,
        limitReached: sent >= FREE_DAILY_LIMIT,
        loading: false,
        dailyLimit: FREE_DAILY_LIMIT,
      });
    } catch (err) {
      console.error("Error in fetchTodayCount:", err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [user, subscribed]);

  useEffect(() => {
    if (!subLoading) {
      fetchTodayCount();
    }
  }, [fetchTodayCount, subLoading]);

  const incrementCount = useCallback(() => {
    if (subscribed) return;
    setState((prev) => {
      const newSent = prev.messagesSentToday + 1;
      const newRemaining = Math.max(0, FREE_DAILY_LIMIT - newSent);
      return {
        ...prev,
        messagesSentToday: newSent,
        remaining: newRemaining,
        limitReached: newSent >= FREE_DAILY_LIMIT,
      };
    });
  }, [subscribed]);

  return {
    ...state,
    isUnlimited: subscribed,
    incrementCount,
    refresh: fetchTodayCount,
  };
}
