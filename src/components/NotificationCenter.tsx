import { useState, useEffect, useCallback } from 'react';
import { Bell, X, Trophy, MessageSquare, Star, Flame, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'achievement' | 'message' | 'streak' | 'points' | 'mention';
  title: string;
  description: string;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user stats for achievements
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const notifs: Notification[] = [];

      // Generate notifications based on user activity
      if (stats) {
        if (stats.current_streak >= 3) {
          notifs.push({
            id: 'streak-' + stats.current_streak,
            type: 'streak',
            title: '🔥 Streak Achievement!',
            description: `You're on a ${stats.current_streak} day streak! Keep it up!`,
            read: false,
            created_at: new Date().toISOString(),
          });
        }

        if (stats.total_points >= 100 && stats.total_points < 200) {
          notifs.push({
            id: 'points-100',
            type: 'points',
            title: '⭐ Milestone Reached!',
            description: 'You\'ve earned 100 XP! You\'re on your way to greatness.',
            read: false,
            created_at: new Date().toISOString(),
          });
        }

        if (stats.messages_sent >= 50) {
          notifs.push({
            id: 'messages-50',
            type: 'achievement',
            title: '🏆 Conversationalist Badge!',
            description: 'You\'ve sent over 50 messages. You\'re officially a pro chatter!',
            read: false,
            created_at: new Date().toISOString(),
          });
        }
      }

      // Check for read status in localStorage
      const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      const updatedNotifs = notifs.map(n => ({
        ...n,
        read: readNotifs.includes(n.id),
      }));

      setNotifications(updatedNotifs);
      setUnreadCount(updatedNotifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Subscribe to user_stats changes for real-time achievement updates
    const channel = supabase
      .channel('stats-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_stats'
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  const markAsRead = (id: string) => {
    const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!readNotifs.includes(id)) {
      readNotifs.push(id);
      localStorage.setItem('readNotifications', JSON.stringify(readNotifs));
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success('All notifications marked as read');
  };

  const clearAll = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
    setNotifications([]);
    setUnreadCount(0);
    toast.success('Notifications cleared');
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'streak':
        return <Flame className="h-4 w-4 text-orange-500" />;
      case 'points':
        return <Star className="h-4 w-4 text-purple-500" />;
      case 'mention':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg hover:bg-muted"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">Keep using Omepilot to earn achievements!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-muted-foreground"
              onClick={clearAll}
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
