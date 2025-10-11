import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Mic, Plus, MessageSquarePlus, PanelLeftClose, Sparkles, FileText, Zap, Brain, MessageCircle, PanelLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

const quickActions = [
  "Create an image",
  "Write a first draft",
  "Improve writing",
  "Write a joke",
  "Rewrite a classic",
  "Improve communication",
  "Clean up notes",
  "Design a logo",
];

interface ChatInterfaceProps {
  onToggleSidebar?: () => void;
}

const AI_MODELS = [
  { id: 'gpt-5', name: 'Smart (GPT-5)', icon: Brain, description: 'Best for complex reasoning' },
  { id: 'gemini', name: 'Quick response', icon: Zap, description: 'Fast everyday conversation' },
  { id: 'groq', name: 'Groq-4-fast', icon: Zap, description: 'Ultra-fast responses' },
  { id: 'anthropic', name: 'Think Deeper', icon: Brain, description: 'Better for complex topics' },
];

export const ChatInterface = ({ onToggleSidebar }: ChatInterfaceProps) => {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("Om");
  const [selectedModel, setSelectedModel] = useState('gemini');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      loadUserName();

      // Subscribe to new messages
      const channel = supabase
        .channel(`messages-${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadUserName = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const handleSend = async () => {
    if (!input.trim() || !conversationId || isLoading) return;

    const messageText = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to send messages');
        return;
      }

      // Call edge function with selected AI provider
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: messageText,
          conversationId,
          provider: selectedModel,
        },
      });

      if (error) throw error;

      if (!data.success) {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPage = () => {
    toast.info('Opening page creator...', { duration: 1000 });
    setTimeout(() => {
      window.location.href = '/create-page';
    }, 500);
  };

  const handleNewChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: 'New Conversation' })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create conversation');
      return;
    }

    window.location.href = `/chat/${data.id}`;
  };

  const handleGenerateImage = () => {
    toast.info('Opening Creator Gallery...', { duration: 1000 });
    setTimeout(() => {
      window.location.href = '/creator-gallery';
    }, 500);
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <h1 className="text-4xl font-semibold text-foreground">
              Nice to see you, {userName}. What's new?
            </h1>
            
            <div className="flex flex-wrap gap-3 justify-center max-w-3xl">
              {quickActions.map((action) => (
                <Button
                  key={action}
                  variant="secondary"
                  onClick={() => handleQuickAction(action)}
                  className="hover:bg-muted"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-card-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="rounded-2xl px-4 py-3 bg-card text-card-foreground">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-card rounded-3xl border border-input p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full hover:bg-muted flex-shrink-0"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-card border-border">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleNewChat}>
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Start new conversation
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNewChat}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start new chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNewPage}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create new page
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onToggleSidebar}>
                  <PanelLeft className="h-4 w-4 mr-2" />
                  Toggle sidebar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleGenerateImage}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-full hover:bg-muted flex-shrink-0 text-sm gap-2"
                >
                  {AI_MODELS.find(m => m.id === selectedModel)?.name || 'Quick response'}
                  <Zap className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 bg-card border-border">
                <DropdownMenuLabel>Choose AI Model</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {AI_MODELS.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className="flex items-start gap-3 p-3 cursor-pointer"
                  >
                    <model.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-muted-foreground">{model.description}</div>
                    </div>
                    {selectedModel === model.id && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Omepilot"
              className="flex-1 border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[24px] max-h-32 py-2"
              rows={1}
            />

            <div className="flex gap-1 flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full hover:bg-muted"
              >
                <Mic className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="rounded-full bg-primary hover:bg-primary/90"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Powered by multiple AI providers for the best responses
          </p>
        </div>
      </div>
    </div>
  );
};