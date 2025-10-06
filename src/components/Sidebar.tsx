import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Compass, Palette, FlaskConical, FileText, Plus, LogOut, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import omepilotLogo from "@/assets/omepilot-logo.png";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export const Sidebar = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    loadConversations();

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

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    setConversations(data || []);
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

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
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
        <Button variant="ghost" className="justify-start gap-3 hover:bg-sidebar-accent">
          <Compass className="h-5 w-5" />
          Discover
        </Button>
        <Button variant="ghost" className="justify-start gap-3 hover:bg-sidebar-accent">
          <Palette className="h-5 w-5" />
          Creator Gallery
          <span className="ml-auto text-xs bg-primary px-2 py-0.5 rounded-md">New</span>
        </Button>
        <Button variant="ghost" className="justify-start gap-3 hover:bg-sidebar-accent">
          <FlaskConical className="h-5 w-5" />
          Labs
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

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 hover:bg-sidebar-accent"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
};