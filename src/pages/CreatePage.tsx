import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, MessageSquare, ArrowLeft } from "lucide-react";

export default function CreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (type: 'conversation' | 'page') => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in');
        return;
      }

      if (type === 'conversation') {
        const { data, error } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title: title,
            is_collaborative: isCollaborative,
          })
          .select()
          .single();

        if (error) throw error;

        // If collaborative, add creator as first member
        if (isCollaborative && data) {
          const { error: memberError } = await supabase
            .from('conversation_members')
            .insert({
              conversation_id: data.id,
              user_id: user.id,
              color: '#3B82F6',
              role: 'owner',
            });

          if (memberError) console.error('Error adding member:', memberError);
        }

        toast.success('Conversation created!');
        navigate(`/chat/${data.id}`);
      } else {
        toast.info('Page creation feature coming soon!');
      }
    } catch (error: any) {
      console.error('Error creating:', error);
      toast.error(error.message || 'Failed to create');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/chat')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Create New</h1>
            <p className="text-muted-foreground mt-2">
              Start a new conversation or create a custom page
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>Conversation</CardTitle>
                    <CardDescription>Start a new AI chat</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="conv-title">Title</Label>
                  <Input
                    id="conv-title"
                    placeholder="Enter conversation title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="collaborative">Collaborative Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable team collaboration
                    </p>
                  </div>
                  <Switch
                    id="collaborative"
                    checked={isCollaborative}
                    onCheckedChange={setIsCollaborative}
                  />
                </div>

                {isCollaborative && (
                  <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2">
                    <Users className="h-4 w-4 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Collaborative Features</p>
                      <ul className="text-muted-foreground text-xs space-y-1 mt-1">
                        <li>• Color-coded messages per user</li>
                        <li>• Real-time typing indicators</li>
                        <li>• AI-powered decision summaries</li>
                        <li>• Invite team members</li>
                      </ul>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => handleCreate('conversation')}
                  disabled={isCreating}
                  className="w-full"
                >
                  Create Conversation
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                    <span className="text-lg">📄</span>
                  </div>
                  <div>
                    <CardTitle>Custom Page</CardTitle>
                    <CardDescription>Coming soon</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create custom pages with AI-powered content generation and collaboration tools.
                </p>
                <Button disabled className="w-full mt-4">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
