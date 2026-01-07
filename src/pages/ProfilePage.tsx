import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Trophy, Flame, Star, MessageSquare, Calendar, Clock, 
  Share2, Copy, Check, Edit2, Camera, Award, Target,
  TrendingUp, Zap, Brain, BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface UserStats {
  total_points: number;
  current_streak: number;
  longest_streak: number;
  messages_sent: number;
  conversations_created: number;
  badges: string[];
  created_at: string;
  last_activity_date: string | null;
}

interface ActivityItem {
  id: string;
  type: 'message' | 'conversation' | 'quiz' | 'achievement';
  description: string;
  created_at: string;
}

const BADGE_INFO: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  'first_message': { icon: MessageSquare, label: 'First Message', color: 'bg-blue-500' },
  'streak_7': { icon: Flame, label: '7 Day Streak', color: 'bg-orange-500' },
  'streak_30': { icon: Flame, label: '30 Day Streak', color: 'bg-red-500' },
  'points_100': { icon: Star, label: '100 XP', color: 'bg-yellow-500' },
  'points_500': { icon: Star, label: '500 XP', color: 'bg-amber-500' },
  'points_1000': { icon: Trophy, label: '1000 XP', color: 'bg-purple-500' },
  'messages_50': { icon: MessageSquare, label: '50 Messages', color: 'bg-green-500' },
  'messages_100': { icon: MessageSquare, label: '100 Messages', color: 'bg-emerald-500' },
  'quiz_master': { icon: BookOpen, label: 'Quiz Master', color: 'bg-indigo-500' },
  'early_adopter': { icon: Zap, label: 'Early Adopter', color: 'bg-pink-500' },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [memberSince, setMemberSince] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    await loadProfile(session.user.id);
    await loadStats(session.user.id);
    await loadActivities(session.user.id);
    setIsLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || '');
      setMemberSince(new Date(user.created_at));
    }

    const { data } = await supabase
      .from('profiles')
      .select('username, created_at')
      .eq('id', userId)
      .single();

    if (data?.username) {
      setUserName(data.username);
      setNewUsername(data.username);
    }
  };

  const loadStats = async (userId: string) => {
    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setStats({
        ...data,
        badges: Array.isArray(data.badges) ? data.badges as string[] : [],
      });
    }
  };

  const loadActivities = async (userId: string) => {
    // Get recent messages
    const { data: messages } = await supabase
      .from('messages')
      .select('id, content, created_at, conversation_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get conversations
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const acts: ActivityItem[] = [];

    messages?.forEach(msg => {
      acts.push({
        id: msg.id,
        type: 'message',
        description: `Sent a message: "${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}"`,
        created_at: msg.created_at,
      });
    });

    conversations?.forEach(conv => {
      acts.push({
        id: conv.id,
        type: 'conversation',
        description: `Started conversation: "${conv.title}"`,
        created_at: conv.created_at,
      });
    });

    // Sort by date
    acts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setActivities(acts.slice(0, 30));
  };

  const updateUsername = async () => {
    if (!newUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername.trim() })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update username');
      return;
    }

    setUserName(newUsername.trim());
    setIsEditing(false);
    toast.success('Username updated!');
  };

  const shareProfile = () => {
    const url = `${window.location.origin}/profile/${userName}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Profile link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'conversation':
        return <Brain className="h-4 w-4 text-purple-500" />;
      case 'quiz':
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce bounce-0" />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce bounce-1" />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce bounce-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto p-6">
          {/* Profile Header */}
          <Card className="mb-6 overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary via-primary/80 to-accent" />
            <CardContent className="relative pt-0 pb-6">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-12">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="h-8 w-48"
                          placeholder="Username"
                        />
                        <Button size="sm" onClick={updateUsername}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-bold">{userName}</h1>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                  {memberSince && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      Member since {format(memberSince, 'MMMM yyyy')}
                    </p>
                  )}
                </div>

                <Button onClick={shareProfile} variant="outline" className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Share Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 text-center bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
              <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats?.current_streak || 0}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </Card>
            <Card className="p-4 text-center bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats?.total_points || 0}</div>
              <div className="text-xs text-muted-foreground">Total XP</div>
            </Card>
            <Card className="p-4 text-center bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats?.messages_sent || 0}</div>
              <div className="text-xs text-muted-foreground">Messages</div>
            </Card>
            <Card className="p-4 text-center bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats?.longest_streak || 0}</div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </Card>
          </div>

          <Tabs defaultValue="badges" className="space-y-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="badges" className="gap-2">
                <Award className="h-4 w-4" />
                Badges
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Clock className="h-4 w-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="badges">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Earned Badges
                  </CardTitle>
                  <CardDescription>
                    Your achievements and milestones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.badges && stats.badges.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {stats.badges.map((badge) => {
                        const info = BADGE_INFO[badge] || { 
                          icon: Trophy, 
                          label: badge, 
                          color: 'bg-gray-500' 
                        };
                        const Icon = info.icon;
                        return (
                          <div 
                            key={badge}
                            className="flex flex-col items-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className={`p-3 rounded-full ${info.color} text-white mb-2`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-medium text-center">{info.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No badges earned yet</p>
                      <p className="text-sm mt-1">Keep using Omepilot to earn badges!</p>
                    </div>
                  )}

                  {/* Locked Badges Preview */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">Badges to Unlock</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(BADGE_INFO)
                        .filter(([key]) => !stats?.badges?.includes(key))
                        .slice(0, 4)
                        .map(([key, info]) => {
                          const Icon = info.icon;
                          return (
                            <div 
                              key={key}
                              className="flex flex-col items-center p-4 rounded-lg bg-muted/30 opacity-50"
                            >
                              <div className="p-3 rounded-full bg-muted text-muted-foreground mb-2">
                                <Icon className="h-6 w-6" />
                              </div>
                              <span className="text-sm text-center text-muted-foreground">{info.label}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your activity history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {activities.length > 0 ? (
                      <div className="space-y-4">
                        {activities.map((activity) => (
                          <div 
                            key={activity.id}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{activity.description}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No activity yet</p>
                        <p className="text-sm mt-1">Start chatting to see your activity!</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Detailed Statistics
                  </CardTitle>
                  <CardDescription>
                    Your complete usage statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        <span>Total Messages Sent</span>
                      </div>
                      <span className="font-bold">{stats?.messages_sent || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Brain className="h-5 w-5 text-purple-500" />
                        <span>Conversations Started</span>
                      </div>
                      <span className="font-bold">{stats?.conversations_created || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <span>Current Streak</span>
                      </div>
                      <span className="font-bold">{stats?.current_streak || 0} days</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-red-500" />
                        <span>Longest Streak</span>
                      </div>
                      <span className="font-bold">{stats?.longest_streak || 0} days</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <span>Total Experience Points</span>
                      </div>
                      <span className="font-bold">{stats?.total_points || 0} XP</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-green-500" />
                        <span>Badges Earned</span>
                      </div>
                      <span className="font-bold">{stats?.badges?.length || 0}</span>
                    </div>
                    {stats?.last_activity_date && (
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <span>Last Active</span>
                        </div>
                        <span className="font-bold">
                          {formatDistanceToNow(new Date(stats.last_activity_date), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
