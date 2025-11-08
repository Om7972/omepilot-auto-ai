import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { supabase } from "@/integrations/supabase/client";

export default function Chat() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    checkAuthAndInitConversation();
  }, []);

  const checkAuthAndInitConversation = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    // Check if user has any conversations
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    // If no conversations exist, create a default one
    if (!conversations || conversations.length === 0) {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user_id: session.user.id,
          title: 'New Conversation',
        })
        .select()
        .single();

      if (!error && newConv) {
        navigate(`/chat/${newConv.id}`);
        return;
      }
    } else {
      // Redirect to most recent conversation
      navigate(`/chat/${conversations[0].id}`);
      return;
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 overflow-hidden">
        <ChatInterface onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      </div>
    </div>
  );
}