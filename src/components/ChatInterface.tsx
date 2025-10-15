import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Mic, MessageSquarePlus, PanelLeftClose, Sparkles, FileText, Zap, Brain, MessageCircle, PanelLeft, Plus } from "lucide-react";
import { PersonaSwitcher } from "@/components/PersonaSwitcher";
import { FileUpload } from "@/components/FileUpload";
import { CollaborativeSession } from "@/components/CollaborativeSession";
import { UserTypingIndicator } from "@/components/UserTypingIndicator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
  user_id?: string;
}

interface UserColor {
  user_id: string;
  color: string;
  username: string;
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
  const [isListening, setIsListening] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [userColors, setUserColors] = useState<Map<string, UserColor>>(new Map());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const typingChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      loadUserName();
      loadConversationInfo();
      loadMemberColors();

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
      setCurrentUserId(user.id);
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

  const loadConversationInfo = async () => {
    if (!conversationId) return;

    const { data } = await supabase
      .from('conversations')
      .select('is_collaborative')
      .eq('id', conversationId)
      .single();

    if (data) {
      setIsCollaborative(data.is_collaborative || false);
    }
  };

  const loadMemberColors = async () => {
    if (!conversationId) return;

    const { data: members } = await supabase
      .from('conversation_members')
      .select('user_id, color')
      .eq('conversation_id', conversationId);

    if (members) {
      const colorMap = new Map<string, UserColor>();
      
      await Promise.all(
        members.map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', member.user_id)
            .single();

          colorMap.set(member.user_id, {
            user_id: member.user_id,
            color: member.color,
            username: profile?.username || 'User',
          });
        })
      );

      setUserColors(colorMap);
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

    // Stop typing indicator
    if (typingChannelRef.current) {
      typingChannelRef.current.track({ typing: false });
    }

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

    // Handle typing indicator
    if (!conversationId || !isCollaborative) return;

    if (input && !typingChannelRef.current) {
      const channel = supabase.channel(`typing-${conversationId}`);
      typingChannelRef.current = channel;
      
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const userColor = userColors.get(currentUserId || '');
          await channel.track({
            user_id: currentUserId,
            username: userName,
            color: userColor?.color || '#3B82F6',
            typing: true,
          });
        }
      });
    }

    if (input) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (typingChannelRef.current) {
          typingChannelRef.current.track({ typing: false });
        }
      }, 2000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [input, conversationId, isCollaborative, currentUserId, userName, userColors]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error('Voice recognition error. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info('Listening...');
    }
  };

  const getUserColor = (userId?: string) => {
    if (!userId) return null;
    return userColors.get(userId);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with Collaborative Controls */}
      {isCollaborative && conversationId && (
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Collaborative Session</h2>
          </div>
          <CollaborativeSession conversationId={conversationId} isCollaborative={isCollaborative} />
        </div>
      )}

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
            {messages.map((message) => {
              const userColor = message.user_id ? getUserColor(message.user_id) : null;
              const isCurrentUser = message.user_id === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'user' && isCollaborative && userColor && (
                    <Avatar 
                      className="h-8 w-8 mt-1" 
                      style={{ backgroundColor: userColor.color }}
                    >
                      <AvatarFallback style={{ backgroundColor: userColor.color, color: 'white' }}>
                        {userColor.username[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    {message.role === 'user' && isCollaborative && userColor && (
                      <span className="text-xs px-2" style={{ color: userColor.color }}>
                        {isCurrentUser ? 'You' : userColor.username}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? isCollaborative && userColor
                            ? 'text-white'
                            : 'bg-primary text-primary-foreground'
                          : 'bg-card text-card-foreground'
                      }`}
                      style={
                        message.role === 'user' && isCollaborative && userColor
                          ? { backgroundColor: userColor.color }
                          : undefined
                      }
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
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
            {isCollaborative && <UserTypingIndicator conversationId={conversationId || ''} />}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-card rounded-3xl border border-input p-2">
            <PersonaSwitcher 
              selectedPersona={selectedPersona}
              onPersonaChange={setSelectedPersona}
            />

            <FileUpload conversationId={conversationId || ''} />
            
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
                onClick={toggleVoiceInput}
                className={`rounded-full hover:bg-muted ${isListening ? 'bg-primary/20 text-primary' : ''}`}
                title="Voice input"
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