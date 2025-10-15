import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TypingUser {
  user_id: string;
  username: string;
  color: string;
}

interface UserTypingIndicatorProps {
  conversationId: string;
}

export const UserTypingIndicator = ({ conversationId }: UserTypingIndicatorProps) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`typing-${conversationId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: TypingUser[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.typing) {
              users.push({
                user_id: presence.user_id,
                username: presence.username,
                color: presence.color,
              });
            }
          });
        });
        
        setTypingUsers(users);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex -space-x-2">
        {typingUsers.map((user) => (
          <div
            key={user.user_id}
            className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white"
            style={{ backgroundColor: user.color }}
          >
            {user.username[0]?.toUpperCase()}
          </div>
        ))}
      </div>
      <span>
        {typingUsers.length === 1
          ? `${typingUsers[0].username} is typing...`
          : `${typingUsers.length} people are typing...`}
      </span>
    </div>
  );
};
