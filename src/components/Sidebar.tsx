import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Compass, Palette, Plus, LogOut, MessageSquare, User, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import omepilotLogo from "@/assets/omepilot-logo.png";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface SidebarProps {
  isOpen?: boolean;
}

export const Sidebar = ({ isOpen = true }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("Om");

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

  const handleNewChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: 'New Conversation',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create conversation');
      return;
    }

    navigate(`/chat/${data.id}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (!isOpen) return null;

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <img src={omepilotLogo} alt="Omepilot" className="w-8 h-8" />
        <span className="text-lg font-semibold text-sidebar-foreground">Omepilot</span>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleNewChat}
          className="ml-auto hover:bg-sidebar-accent"
        >
          <Plus className="h-5 w-5" />
        </Button>
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
      </div>

      {/* Conversations */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-3">
          <h3 className="text-sm font-semibold text-sidebar-foreground">Conversations</h3>
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="flex flex-col gap-1 pb-4">
            {conversations.map((conv) => (
              <Link key={conv.id} to={`/chat/${conv.id}`}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 hover:bg-sidebar-accent text-left"
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </Button>
              </Link>
            ))}
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
            <DropdownMenuItem disabled className="flex justify-between">
              <span>Voice</span>
              <span className="text-muted-foreground">RAIN</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="flex justify-between">
              <span>Language</span>
              <span className="text-muted-foreground">EN</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="flex justify-between">
              <span>Theme</span>
              <span className="text-muted-foreground">NIGHT</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Manage memory</DropdownMenuItem>
            <DropdownMenuItem disabled>Give feedback</DropdownMenuItem>
            <DropdownMenuItem disabled>About</DropdownMenuItem>
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