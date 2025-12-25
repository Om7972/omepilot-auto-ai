import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Compass, Palette, Plus, LogOut, ChevronDown, Globe, Moon, Sun, Info, MessageCircle, Search, BookOpen, Brain, FileText, PanelLeftClose } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import omepilotLogo from "@/assets/omepilot-logo.png";
import { ConversationItem } from "./ConversationItem";
import { useTheme } from "./ThemeProvider";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("Om");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadConversations();
    loadUserInfo();

    // Subscribe to conversation changes
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

    // Get first message for each conversation to use as title
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
            title: firstMessage.length > 30 
              ? firstMessage.substring(0, 30) + '...' 
              : firstMessage
          };
        }
        return conv;
      })
    );

    setConversations(conversationsWithTitles);
  };

  const handleNewChat = () => {
    navigate('/chat');
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

    return {
      today: filtered.filter(conv => new Date(conv.created_at) >= today),
      yesterday: filtered.filter(conv => {
        const date = new Date(conv.created_at);
        return date >= yesterday && date < today;
      }),
      pastWeek: filtered.filter(conv => {
        const date = new Date(conv.created_at);
        return date >= lastWeek && date < yesterday;
      }),
      older: filtered.filter(conv => new Date(conv.created_at) < lastWeek),
    };
  };

  const groupedConversations = groupConversationsByDate();

  return (
    <div className={`flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${!isOpen ? 'hidden md:flex' : 'flex'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <img src={omepilotLogo} alt="Omepilot" className="w-8 h-8" />
        <span className="text-lg font-semibold text-sidebar-foreground">Omepilot</span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNewChat}
            className="hover:bg-sidebar-accent h-8 w-8"
            title="New chat"
          >
            <Plus className="h-5 w-5" />
          </Button>
          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="hover:bg-sidebar-accent h-8 w-8"
              title="Close sidebar"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Box */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-input focus-visible:ring-1 h-9"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-1 p-3 border-b border-sidebar-border">
        <Button
          variant={location.pathname === '/discover' ? 'default' : 'ghost'}
          onClick={() => navigate('/discover')}
          className="justify-start gap-3 hover:bg-sidebar-accent"
        >
          <Compass className="h-5 w-5" />
          Discover
        </Button>
        <Button
          variant={location.pathname === '/creator-gallery' ? 'default' : 'ghost'}
          onClick={() => navigate('/creator-gallery')}
          className="justify-start gap-3 hover:bg-sidebar-accent"
        >
          <Palette className="h-5 w-5" />
          Creator Gallery
          <span className="ml-auto text-xs bg-primary px-2 py-0.5 rounded-md">New</span>
        </Button>
        <Button
          variant={location.pathname === '/quiz' ? 'default' : 'ghost'}
          onClick={() => navigate('/quiz')}
          className="justify-start gap-3 hover:bg-sidebar-accent"
        >
          <BookOpen className="h-5 w-5" />
          Quiz Generator
        </Button>
        <Button
          variant={location.pathname === '/search' ? 'default' : 'ghost'}
          onClick={() => navigate('/search')}
          className="justify-start gap-3 hover:bg-sidebar-accent"
        >
          <Globe className="h-5 w-5" />
          Web Search
        </Button>
        <Button
          variant={location.pathname === '/memory' ? 'default' : 'ghost'}
          onClick={() => navigate('/memory')}
          className="justify-start gap-3 hover:bg-sidebar-accent"
        >
          <Brain className="h-5 w-5" />
          AI Memory
        </Button>
        <Button
          variant={location.pathname === '/create-page' ? 'default' : 'ghost'}
          onClick={() => navigate('/create-page')}
          className="justify-start gap-3 hover:bg-sidebar-accent"
        >
          <FileText className="h-5 w-5" />
          Create Page
        </Button>
      </div>

      {/* Conversations */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-3">
          <h3 className="text-sm font-semibold text-sidebar-foreground">Conversations</h3>
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="flex flex-col gap-1 pb-4">
            {groupedConversations.today.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground px-2 py-2">Today</h4>
                {groupedConversations.today.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    id={conv.id}
                    title={conv.title}
                    onDelete={loadConversations}
                    onUpdate={loadConversations}
                  />
                ))}
              </div>
            )}

            {groupedConversations.yesterday.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground px-2 py-2">Yesterday</h4>
                {groupedConversations.yesterday.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    id={conv.id}
                    title={conv.title}
                    onDelete={loadConversations}
                    onUpdate={loadConversations}
                  />
                ))}
              </div>
            )}

            {groupedConversations.pastWeek.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground px-2 py-2">Past Week</h4>
                {groupedConversations.pastWeek.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    id={conv.id}
                    title={conv.title}
                    onDelete={loadConversations}
                    onUpdate={loadConversations}
                  />
                ))}
              </div>
            )}

            {groupedConversations.older.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground px-2 py-2">Older</h4>
                {groupedConversations.older.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    id={conv.id}
                    title={conv.title}
                    onDelete={loadConversations}
                    onUpdate={loadConversations}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 hover:bg-sidebar-accent"
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="font-medium truncate">{userName}</div>
                <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
              </div>
              <ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-card border-border">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <div className="font-semibold">{userName}</div>
                <div className="text-xs font-normal text-muted-foreground">{userEmail}</div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              toast.success(`Theme set to ${theme === "dark" ? "Light" : "Dark"}`);
            }}>
              {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => toast.info("About Omepilot: Your AI-powered assistant")}>
              <Info className="h-4 w-4 mr-2" />
              About
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("Feedback form opened")}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Give feedback
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};