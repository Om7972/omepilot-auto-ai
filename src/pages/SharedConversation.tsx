import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Lock, AlertCircle } from "lucide-react";

interface SharedMessage {
  id: string;
  content: string;
  role: string;
  created_at: string;
  is_pinned: boolean;
}

interface SharedData {
  conversation: { id: string; title: string; created_at: string };
  messages: SharedMessage[];
}

export default function SharedConversation() {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("share") || searchParams.get("token");
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId || !token) {
      setError("Missing conversation ID or share token");
      setLoading(false);
      return;
    }

    const fetchShared = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const url = `https://${projectId}.supabase.co/functions/v1/shared-conversation?conversationId=${encodeURIComponent(conversationId)}&token=${encodeURIComponent(token)}`;
        
        const resp = await fetch(url, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });

        const json = await resp.json();
        if (!resp.ok) {
          setError(json.error || "Failed to load shared conversation");
        } else {
          setData(json);
        }
      } catch {
        setError("Failed to load shared conversation");
      } finally {
        setLoading(false);
      }
    };

    fetchShared();
  }, [conversationId, token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            {error.includes("Invalid") || error.includes("token") ? (
              <Lock className="h-6 w-6 text-destructive" />
            ) : (
              <AlertCircle className="h-6 w-6 text-destructive" />
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Cannot access conversation</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">{data.conversation.title}</h1>
            <p className="text-xs text-muted-foreground">
              Shared conversation · Read-only
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          {data.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="mt-1 text-[10px] opacity-60">
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <footer className="border-t bg-card px-6 py-3 text-center text-xs text-muted-foreground">
        This is a read-only view of a shared conversation.
      </footer>
    </div>
  );
}
