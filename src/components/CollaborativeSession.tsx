import { useEffect, useState } from "react";
import { Users, UserPlus, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Member {
  id: string;
  user_id: string;
  color: string;
  username?: string;
  is_online?: boolean;
}

interface CollaborativeSessionProps {
  conversationId: string;
  isCollaborative: boolean;
}

const AVAILABLE_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", 
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"
];

export const CollaborativeSession = ({ conversationId, isCollaborative }: CollaborativeSessionProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isCollaborative || !conversationId) return;

    loadMembers();

    // Subscribe to member changes
    const channel = supabase
      .channel(`conversation-members-${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversation_members',
        filter: `conversation_id=eq.${conversationId}`
      }, () => {
        loadMembers();
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            online.add(presence.user_id);
          });
        });
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, isCollaborative]);

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from('conversation_members')
      .select('id, user_id, color')
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error loading members:', error);
      return;
    }

    // Fetch usernames for members
    const membersWithNames = await Promise.all(
      (data || []).map(async (member) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', member.user_id)
          .single();
        
        return {
          ...member,
          username: profile?.username || 'User',
        };
      })
    );

    setMembers(membersWithNames);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsInviting(true);
    try {
      // Find user by email (simplified - in production, use a proper invite system)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', inviteEmail)
        .single();

      if (!profiles) {
        toast.error('User not found');
        return;
      }

      // Assign a color
      const usedColors = members.map(m => m.color);
      const availableColor = AVAILABLE_COLORS.find(c => !usedColors.includes(c)) || AVAILABLE_COLORS[0];

      const { error } = await supabase
        .from('conversation_members')
        .insert({
          conversation_id: conversationId,
          user_id: profiles.id,
          color: availableColor,
        });

      if (error) throw error;

      toast.success('Member invited successfully');
      setInviteEmail('');
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast.error(error.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleLeave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('conversation_members')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to leave conversation');
      return;
    }

    toast.success('Left the conversation');
    window.location.href = '/chat';
  };

  const handleSummarize = async () => {
    toast.info('Generating group decision summary...', { duration: 2000 });
    
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: 'Please summarize the key decisions and action items from this collaborative discussion.',
          conversationId,
          provider: 'gemini',
        },
      });

      if (error) throw error;
      if (!data.success) {
        toast.error(data.error || 'Failed to generate summary');
      }
    } catch (error: any) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    }
  };

  if (!isCollaborative) return null;

  return (
    <div className="flex items-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{members.length} Members</span>
            <Badge variant="secondary" className="ml-1">{onlineUsers.size} online</Badge>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Collaborative Session</DialogTitle>
            <DialogDescription>
              Manage team members and session settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Members */}
            <div>
              <h4 className="text-sm font-medium mb-2">Active Members</h4>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <Avatar className="h-8 w-8" style={{ backgroundColor: member.color }}>
                      <AvatarFallback style={{ backgroundColor: member.color, color: 'white' }}>
                        {member.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm">{member.username}</span>
                    {onlineUsers.has(member.user_id) && (
                      <Badge variant="secondary" className="text-xs">Online</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Members */}
            <div>
              <h4 className="text-sm font-medium mb-2">Invite Member</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter username..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
                <Button onClick={handleInvite} disabled={isInviting} size="sm">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button onClick={handleSummarize} variant="outline" className="flex-1 gap-2">
                <Sparkles className="h-4 w-4" />
                Summarize Discussion
              </Button>
              <Button onClick={handleLeave} variant="destructive" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Leave
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
