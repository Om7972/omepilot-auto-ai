import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Mic, MessageSquarePlus, PanelLeftClose, Sparkles, FileText, Zap, Brain, MessageCircle, PanelLeft, Plus } from "lucide-react";
import { PersonaSwitcher } from "@/components/PersonaSwitcher";
import { FileUpload } from "@/components/FileUpload";
import { CollaborativeSession } from "@/components/CollaborativeSession";
import { UserTypingIndicator } from "@/components/UserTypingIndicator";
import { ChatLandingPage } from "@/components/ChatLandingPage";
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


interface ChatInterfaceProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

const AI_MODELS = [
  { id: 'gpt-5', name: 'Smart (GPT-5)', icon: Brain, description: 'Best for complex reasoning' },
  { id: 'gemini', name: 'Quick response', icon: Zap, description: 'Fast everyday conversation' },
  { id: 'groq', name: 'Groq-4-fast', icon: Zap, description: 'Ultra-fast responses' },
  { id: 'anthropic', name: 'Think Deeper', icon: Brain, description: 'Better for complex topics' },
];

export const ChatInterface = ({ onToggleSidebar, isSidebarCollapsed = false }: ChatInterfaceProps) => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("User");
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [isListening, setIsListening] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string>('gemini');
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [userColors, setUserColors] = useState<Map<string, UserColor>>(new Map());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const typingChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);

  const handleCollaborativeChange = (enabled: boolean) => {
    setIsCollaborative(enabled);
  };

  useEffect(() => {
    loadUserName();
    
    if (conversationId) {
      loadMessages();
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
    } else {
      // Clear messages when on landing page
      setMessages([]);
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

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
        // Redirect to landing page on error
        navigate('/chat');
        return;
      }

      setMessages(data || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load conversation');
      navigate('/chat');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

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
        setInput(messageText); // Restore input
        setIsLoading(false);
        return;
      }

      let activeConversationId = conversationId;

      // If no conversation exists, create one
      if (!conversationId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: session.user.id,
            title: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
          })
          .select()
          .single();

        if (convError) {
          console.error('Error creating conversation:', convError);
          toast.error('Failed to create conversation');
          setInput(messageText); // Restore input
          setIsLoading(false);
          return;
        }

        activeConversationId = newConv.id;
        
        // Navigate to the new conversation
        navigate(`/chat/${newConv.id}`);
      }

      // Call edge function with selected AI provider
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: messageText,
          conversationId: activeConversationId,
          provider: selectedPersona,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        if (error.message?.includes('500')) {
          toast.error('AI service configuration error. Please check that API keys are set in Supabase dashboard.', {
            duration: 5000,
          });
        } else {
          throw error;
        }
        setInput(messageText);
        setIsLoading(false);
        return;
      }

      if (!data.success) {
        toast.error(data.error || 'Failed to send message');
        setInput(messageText);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Provide helpful error messages
      if (error.message?.includes('500') || error.message?.includes('Edge Function')) {
        toast.error('AI service temporarily unavailable. Please try again.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast.error('Network error. Please check your internet connection.');
      } else if (error.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else {
        toast.error(error.message || 'Failed to send message');
      }
      
      setInput(messageText); // Restore input on error
    } finally {
      setIsLoading(false);
    }
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
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        
        // Handle specific error types
        switch (event.error) {
          case 'no-speech':
            toast.error('No speech detected. Please try speaking again.');
            break;
          case 'audio-capture':
            toast.error('Microphone not found. Please check your microphone settings.');
            break;
          case 'not-allowed':
            toast.error('Microphone access denied. Please allow microphone access in your browser settings.');
            break;
          case 'network':
            toast.error('Network error. Please check your internet connection.');
            break;
          case 'aborted':
            // User aborted, no need to show error
            break;
          default:
            toast.error('Voice recognition unavailable. Please try again or type your message.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceInput = async () => {
    if (!recognitionRef.current) {
      toast.error('Voice input not supported in your browser. Try Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('Listening... Speak now', { duration: 2000 });
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast.error('Microphone access denied. Please allow microphone access to use voice input.');
        } else if (err.name === 'NotFoundError') {
          toast.error('No microphone found. Please connect a microphone.');
        } else {
          toast.error('Could not access microphone. Please check your settings.');
        }
      }
    }
  };

  const getUserColor = (userId?: string) => {
    if (!userId) return null;
    return userColors.get(userId);
  };

  const handleNewChat = () => {
    navigate('/chat');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main Header with Sidebar Toggle */}
      <div className="border-b border-border p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleSidebar}
              className="rounded-lg hover:bg-muted"
              title="Toggle sidebar"
            >
              <PanelLeft className={`h-5 w-5 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          )}
          <h2 className="text-lg font-semibold">Omepilot</h2>
        </div>
        {conversationId && (
          <CollaborativeSession 
            conversationId={conversationId} 
            isCollaborative={isCollaborative}
            onCollaborativeChange={handleCollaborativeChange}
          />
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <ChatLandingPage 
            userName={userName} 
            onQuickAction={handleQuickAction}
          />
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
            {isCollaborative && <UserTypingIndicator conversationId={conversationId || ''} />}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Main Input Area */}
          <div className="relative flex items-end gap-2 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-3 shadow-lg">
            <MessageSquarePlus className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
            
            <div className="flex-1 flex flex-col gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Copilot"
                className="flex-1 border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[24px] max-h-32 py-0 text-base placeholder:text-muted-foreground/60"
                rows={1}
              />
              
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleNewChat}
                  className="rounded-lg hover:bg-accent h-8 w-8"
                  title="New conversation"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <PersonaSwitcher 
                  selectedPersona={selectedPersona}
                  onPersonaChange={(persona) => {
                    setSelectedPersona(persona);
                    setSelectedModel(persona);
                  }}
                />
                <FileUpload conversationId={conversationId || ''} />
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleVoiceInput}
                className={`rounded-full hover:bg-accent h-10 w-10 ${isListening ? 'bg-primary/20 text-primary' : ''}`}
                title="Voice input"
              >
                <Mic className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="rounded-full bg-primary hover:bg-primary/90 h-10 w-10"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};