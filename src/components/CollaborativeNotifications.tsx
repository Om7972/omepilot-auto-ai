import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, MessageSquare } from "lucide-react";

interface CollaborativeNotificationsProps {
  conversationId: string;
  currentUserId: string | null;
  isCollaborative: boolean;
}

export const CollaborativeNotifications = ({
  conversationId,
  currentUserId,
  isCollaborative,
}: CollaborativeNotificationsProps) => {
  const processedEvents = useRef<Set<string>>(new Set());
  const soundRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback(() => {
    const soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
    if (!soundEnabled) return;

    // Create a simple notification sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // Audio not supported
    }
  }, []);

  useEffect(() => {
    if (!conversationId || !isCollaborative || !currentUserId) return;

    // Subscribe to new messages in the conversation
    const messagesChannel = supabase
      .channel(`collab-messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        const message = payload.new as any;
        
        // Don't notify for own messages or AI messages
        if (message.user_id === currentUserId || message.role === 'assistant') return;
        
        // Prevent duplicate notifications
        const eventKey = `msg-${message.id}`;
        if (processedEvents.current.has(eventKey)) return;
        processedEvents.current.add(eventKey);

        // Get the sender's username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', message.user_id)
          .single();

        const username = profile?.username || 'Someone';
        const preview = message.content.length > 50 
          ? message.content.substring(0, 50) + '...' 
          : message.content;

        playNotificationSound();
        
        toast.custom((t) => (
          <div className="flex items-start gap-3 bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm">
            <Avatar className="h-8 w-8 bg-primary">
              <AvatarFallback className="text-primary-foreground text-xs">
                {username[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{username}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate mt-1">{preview}</p>
            </div>
          </div>
        ), {
          duration: 4000,
          position: 'top-right',
        });
      })
      .subscribe();

    // Subscribe to new members joining
    const membersChannel = supabase
      .channel(`collab-members-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_members',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        const member = payload.new as any;
        
        // Don't notify for own join
        if (member.user_id === currentUserId) return;

        // Prevent duplicate notifications
        const eventKey = `join-${member.id}`;
        if (processedEvents.current.has(eventKey)) return;
        processedEvents.current.add(eventKey);

        // Get the new member's username
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', member.user_id)
          .single();

        const username = profile?.username || 'Someone';

        playNotificationSound();

        toast.custom((t) => (
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm">
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: member.color || '#3B82F6' }}
            >
              <UserPlus className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-sm">{username}</span>
              <span className="text-sm text-muted-foreground"> joined the conversation</span>
            </div>
          </div>
        ), {
          duration: 4000,
          position: 'top-right',
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [conversationId, currentUserId, isCollaborative, playNotificationSound]);

  return null;
};
