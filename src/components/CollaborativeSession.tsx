import { useEffect, useState } from "react";
import { Users, UserPlus, LogOut, Sparkles, Link2, Copy, Check, Share2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  onCollaborativeChange?: (isCollaborative: boolean) => void;
}

const AVAILABLE_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", 
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"
];

export const CollaborativeSession = ({ 
  conversationId, 
  isCollaborative,
  onCollaborativeChange 
}: CollaborativeSessionProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteUsername, setInviteUsername] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!conversationId) return;

    checkOwnership();
    if (isCollaborative) {
      loadMembers();
      setupPresence();
    }
  }, [conversationId, isCollaborative]);

  const checkOwnership = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    setIsOwner(data?.user_id === user.id);
  };

  const setupPresence = () => {
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
  };

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from('conversation_members')
      .select('id, user_id, color')
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error loading members:', error);
      return;
    }

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

  const toggleCollaborative = async (enabled: boolean) => {
    const { error } = await supabase
      .from('conversations')
      .update({ is_collaborative: enabled })
      .eq('id', conversationId);

    if (error) {
      toast.error('Failed to update collaboration settings');
      return;
    }

    if (enabled) {
      // Add owner as first member
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('conversation_members').upsert({
          conversation_id: conversationId,
          user_id: user.id,
          color: AVAILABLE_COLORS[0],
          role: 'owner'
        });
      }
    }

    onCollaborativeChange?.(enabled);
    toast.success(enabled ? 'Collaboration enabled!' : 'Collaboration disabled');
  };

  const handleInvite = async () => {
    if (!inviteUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setIsInviting(true);
    try {
      // Use secure edge function with rate limiting to prevent username enumeration
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { 
          username: inviteUsername.trim(), 
          conversation_id: conversationId 
        },
      });

      if (error) {
        console.error('Error inviting member:', error);
        toast.error('Failed to process invite request');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Show generic success message (prevents username enumeration)
      toast.success('Invite request processed. The user will be notified if they exist.');
      setInviteUsername('');
      
      // Reload members after a brief delay to allow for DB update
      setTimeout(() => loadMembers(), 500);
    } catch (error: any) {
      console.error('Error inviting member:', error);
      toast.error('Failed to process invite request');
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
    window.location.href = '/';
  };

  const handleSummarize = async () => {
    toast.info('Generating summary...', { duration: 2000 });
    
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

  const copyShareLink = () => {
    const link = `${window.location.origin}/chat/${conversationId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied!');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isCollaborative ? `${members.length} Members` : 'Share'}
          </span>
          {isCollaborative && onlineUsers.size > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {onlineUsers.size} online
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaboration
          </DialogTitle>
          <DialogDescription>
            Share and collaborate on this conversation
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={isCollaborative ? "members" : "settings"} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="members" disabled={!isCollaborative}>Members</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 mt-4">
            {/* Enable Collaboration Toggle */}
            {isOwner && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-0.5">
                  <Label htmlFor="collaborative">Enable Collaboration</Label>
                  <p className="text-xs text-muted-foreground">Allow others to join this conversation</p>
                </div>
                <Switch
                  id="collaborative"
                  checked={isCollaborative}
                  onCheckedChange={toggleCollaborative}
                />
              </div>
            )}

            {/* Share Link */}
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/chat/${conversationId}`}
                  className="text-xs"
                />
                <Button size="icon" variant="outline" onClick={copyShareLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isCollaborative 
                  ? 'Anyone with this link can view the conversation. Invite members to allow editing.'
                  : 'Enable collaboration to allow others to participate.'}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4 mt-4">
            {/* Members List */}
            <div className="space-y-2">
              <Label>Active Members ({members.length})</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback style={{ backgroundColor: member.color, color: 'white' }}>
                        {member.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{member.username}</span>
                    {onlineUsers.has(member.user_id) && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-muted-foreground">Online</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Members */}
            {isOwner && (
              <div className="space-y-2">
                <Label>Invite Member</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter username..."
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  />
                  <Button onClick={handleInvite} disabled={isInviting} size="sm">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button onClick={handleSummarize} variant="outline" className="flex-1 gap-2" size="sm">
                <Sparkles className="h-4 w-4" />
                Summarize
              </Button>
              <Button onClick={handleLeave} variant="destructive" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Leave
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};