import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface OnlineUser {
  user_id: string;
  username: string;
  color: string;
  online_at: string;
}

interface OnlineUsersIndicatorProps {
  conversationId: string;
  className?: string;
}

export const OnlineUsersIndicator = ({ conversationId, className }: OnlineUsersIndicatorProps) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`presence-${conversationId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (!users.find(u => u.user_id === presence.user_id)) {
              users.push({
                user_id: presence.user_id,
                username: presence.username || 'User',
                color: presence.color || '#3B82F6',
                online_at: presence.online_at,
              });
            }
          });
        });
        
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', user.id)
              .single();
            
            const { data: member } = await supabase
              .from('conversation_members')
              .select('color')
              .eq('conversation_id', conversationId)
              .eq('user_id', user.id)
              .single();

            await channel.track({
              user_id: user.id,
              username: profile?.username || 'User',
              color: member?.color || '#3B82F6',
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  if (onlineUsers.length === 0) return null;

  const displayUsers = onlineUsers.slice(0, 4);
  const remainingCount = onlineUsers.length - 4;

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <Tooltip key={user.user_id}>
            <TooltipTrigger asChild>
              <Avatar 
                className={cn(
                  "h-7 w-7 border-2 border-background cursor-pointer transition-transform hover:scale-110 hover:z-10",
                  user.user_id === currentUserId && "ring-2 ring-primary ring-offset-1"
                )}
              >
                <AvatarFallback 
                  style={{ backgroundColor: user.color }} 
                  className="text-white text-xs font-medium"
                >
                  {user.username[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {user.user_id === currentUserId ? 'You' : user.username}
              <span className="ml-1 text-green-500">● online</span>
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-7 w-7 border-2 border-background cursor-pointer">
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {remainingCount} more online
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
