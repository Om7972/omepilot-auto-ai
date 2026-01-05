import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Compass, Palette, Plus, LogOut, ChevronDown, Globe, Moon, Sun, Info, MessageCircle, Search, BookOpen, Brain, FileText, PanelLeftOpen, PanelLeftClose, HelpCircle, CreditCard, Pin, LayoutDashboard, Settings, Trophy } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import omepilotLogo from "@/assets/omepilot-logo.png";
import { ConversationItem } from "./ConversationItem";
import { useTheme } from "./ThemeProvider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AboutDialog } from "./AboutDialog";
import { FeedbackDialog } from "./FeedbackDialog";
import { HelpDialog } from "./HelpDialog";
import { SubscriptionDialog } from "./SubscriptionDialog";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  is_pinned?: boolean;
  share_token?: string | null;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("User");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { theme, setTheme } = useTheme();
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);

  useEffect(() => {
    loadConversations();
    loadUserInfo();

    const channel = supabase
      .channel('conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || "");
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (data?.username) {
        setUserName(data.username);
      }
    }
  };

  const loadConversations = async () => {
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Error loading conversations:', convError);
      return;
    }

    const conversationsWithTitles = await Promise.all(
      (convData || []).map(async (conv) => {
        const { data: messages } = await supabase
          .from('messages')
          .select('content')
          .eq('conversation_id', conv.id)
          .eq('role', 'user')
          .order('created_at', { ascending: true })
          .limit(1);

        if (messages && messages.length > 0) {
          const firstMessage = messages[0].content;
          return {
            ...conv,
            title: firstMessage.length > 35 
              ? firstMessage.substring(0, 35) + '...' 
              : firstMessage
          };
        }
        return conv;
      })
    );

    setConversations(conversationsWithTitles);
  };

  const handleNewChat = () => {
    navigate('/');
    toast.success('Starting new conversation');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const groupConversationsByDate = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const filtered = conversations.filter(conv => 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Separate pinned conversations
    const pinned = filtered.filter(conv => conv.is_pinned);
    const unpinned = filtered.filter(conv => !conv.is_pinned);

    return {
      pinned,
      today: unpinned.filter(conv => new Date(conv.created_at) >= today),
      yesterday: unpinned.filter(conv => {
        const date = new Date(conv.created_at);
        return date >= yesterday && date < today;
      }),
      pastWeek: unpinned.filter(conv => {
        const date = new Date(conv.created_at);
        return date >= lastWeek && date < yesterday;
      }),
      older: unpinned.filter(conv => new Date(conv.created_at) < lastWeek),
    };
  };

  const groupedConversations = groupConversationsByDate();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/discover', icon: Compass, label: 'Discover' },
    { path: '/creator-gallery', icon: Palette, label: 'Creator Studio' },
    { path: '/quiz', icon: BookOpen, label: 'Quiz' },
    { path: '/search', icon: Globe, label: 'Search' },
    { path: '/memory', icon: Brain, label: 'Memory' },
    { path: '/create-page', icon: FileText, label: 'Create' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const ConversationGroup = ({ title, conversations, icon }: { title: string; conversations: Conversation[]; icon?: React.ReactNode }) => {
    if (conversations.length === 0) return null;
    return (
      <div className="mb-2">
        <p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
          {icon}
          {title}
        </p>
        {conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            id={conv.id}
            title={conv.title}
            isPinned={conv.is_pinned}
            shareToken={conv.share_token}
            onDelete={loadConversations}
            onUpdate={loadConversations}
          />
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div 
        className={`flex h-screen flex-col bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border/50 transition-all duration-300 ease-out ${
          isCollapsed ? 'w-[60px]' : 'w-[260px]'
        }`}
      >
        {/* Logo Header */}
        <div className={`flex items-center h-14 border-b border-sidebar-border/50 ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}>
          <div className={`flex items-center gap-2.5 ${isCollapsed ? '' : 'flex-1'}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg blur-sm" />
              <img src={omepilotLogo} alt="Omepilot" className="relative w-8 h-8 rounded-lg shadow-lg" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Omepilot</span>
                <span className="text-[10px] text-muted-foreground -mt-0.5">AI Assistant</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleNewChat}
                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New chat</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onToggle}
                    className="h-8 w-8 rounded-lg hover:bg-muted"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Collapse sidebar</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Collapsed Toggle */}
        {isCollapsed && (
          <div className="flex flex-col items-center gap-2 py-3 border-b border-sidebar-border/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleNewChat}
                  className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New chat</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onToggle}
                  className="h-9 w-9 rounded-lg hover:bg-muted"
                >
                  <PanelLeftOpen className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Search */}
        {!isCollapsed && (
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className={`flex flex-col gap-0.5 py-2 ${isCollapsed ? 'items-center px-2' : 'px-2'}`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return isCollapsed ? (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(item.path)}
                    className={`h-9 w-9 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-primary/15 text-primary' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => navigate(item.path)}
                className={`h-8 justify-start gap-2.5 px-2.5 rounded-lg text-sm font-normal transition-colors ${
                  isActive 
                    ? 'bg-primary/15 text-primary' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Conversations - takes remaining space */}
        {!isCollapsed && (
          <div className="flex-1 flex flex-col min-h-0 border-t border-sidebar-border/50">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Conversations</p>
              <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded">
                {conversations.length}
              </span>
            </div>
            <ScrollArea className="flex-1 px-2">
              <ConversationGroup title="Pinned" conversations={groupedConversations.pinned} icon={<Pin className="h-3 w-3" />} />
              <ConversationGroup title="Today" conversations={groupedConversations.today} />
              <ConversationGroup title="Yesterday" conversations={groupedConversations.yesterday} />
              <ConversationGroup title="Past Week" conversations={groupedConversations.pastWeek} />
              <ConversationGroup title="Older" conversations={groupedConversations.older} />
              <div className="h-4" />
            </ScrollArea>
          </div>
        )}

        {/* Collapsed conversations */}
        {isCollapsed && (
          <div className="flex-1 flex flex-col items-center py-2 border-t border-sidebar-border/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="h-9 w-9 rounded-lg hover:bg-muted"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Conversations ({conversations.length})</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* User Profile */}
        <div className={`border-t border-sidebar-border/50 ${isCollapsed ? 'p-2 flex justify-center' : 'p-2'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {isCollapsed ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg hover:bg-muted"
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xs font-semibold shadow-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full h-10 justify-start gap-2.5 px-2 rounded-lg hover:bg-muted"
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xs font-semibold shadow-sm flex-shrink-0">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{userName}</p>
                    <p className="text-[10px] text-muted-foreground truncate -mt-0.5">{userEmail}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align={isCollapsed ? "center" : "end"} 
              side={isCollapsed ? "right" : "top"}
              className="w-56"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setShowSubscriptionDialog(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowHelpDialog(true)}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setShowAboutDialog(true)}>
                <Info className="h-4 w-4 mr-2" />
                About
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowFeedbackDialog(true)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Give Feedback
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <AboutDialog open={showAboutDialog} onOpenChange={setShowAboutDialog} />
      <FeedbackDialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog} />
      <HelpDialog open={showHelpDialog} onOpenChange={setShowHelpDialog} />
      <SubscriptionDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog} />
    </TooltipProvider>
  );
};