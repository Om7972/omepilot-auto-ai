import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, MessageSquare, ArrowLeft, FileText, Image, Sparkles, Code } from "lucide-react";

export default function CreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedType, setSelectedType] = useState<'conversation' | 'document' | 'image' | 'code'>('conversation');

  const handleCreate = async () => {
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

      if (selectedType === 'conversation') {
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
      } else if (selectedType === 'document') {
        toast.info('Generating document with AI...');
        const { data: docData, error: docError } = await supabase.functions.invoke('generate-document', {
          body: { 
            title, 
            description,
            type: 'article'
          }
        });

        if (docError) {
          console.error('Document generation error:', docError);
          throw new Error('Failed to generate document. Please try again.');
        }

        if (!docData || !docData.success) {
          throw new Error(docData?.error || 'Failed to generate document');
        }

        if (docData.success) {
          // Create conversation with generated document
          const { data, error } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              title: title,
            })
            .select()
            .single();

          if (error) throw error;

          // Save document as first message
          await supabase
            .from('messages')
            .insert({
              conversation_id: data.id,
              role: 'assistant',
              content: docData.content,
            });

          toast.success('Document generated!');
          navigate(`/chat/${data.id}`);
        }
      } else if (selectedType === 'image') {
        toast.info('Generating image...');
        const { data: imgData, error: imgError } = await supabase.functions.invoke('generate-image', {
          body: { prompt: title }
        });

        if (imgError) {
          console.error('Image generation error:', imgError);
          throw new Error('Failed to generate image. Please try again.');
        }

        if (!imgData || !imgData.success) {
          throw new Error(imgData?.error || 'Failed to generate image');
        }

        if (imgData.image) {
          // Create conversation with image
          const { data, error } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              title: title,
            })
            .select()
            .single();

          if (error) throw error;

          await supabase
            .from('messages')
            .insert({
              conversation_id: data.id,
              role: 'assistant',
              content: `![Generated Image](${imgData.image})`,
            });

          toast.success('Image generated!');
          navigate(`/chat/${data.id}`);
        }
      } else {
        toast.info('Generating code...');
        const { data: codeData, error: codeError } = await supabase.functions.invoke('generate-code', {
          body: { 
            title, 
            description,
            language: 'JavaScript'
          }
        });

        if (codeError) {
          console.error('Code generation error:', codeError);
          throw new Error('Failed to generate code. Please try again.');
        }

        if (!codeData || !codeData.success) {
          throw new Error(codeData?.error || 'Failed to generate code');
        }

        if (codeData.success) {
          // Create conversation with code
          const { data, error } = await supabase
            .from('conversations')
            .insert({
              user_id: user.id,
              title: title,
            })
            .select()
            .single();

          if (error) throw error;

          await supabase
            .from('messages')
            .insert({
              conversation_id: data.id,
              role: 'assistant',
              content: codeData.code,
            });

          toast.success('Code generated!');
          navigate(`/chat/${data.id}`);
        }
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
              Choose what you want to create with AI assistance
            </p>
          </div>

          {/* Type Selection */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card 
              className={`cursor-pointer transition-all ${selectedType === 'conversation' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedType('conversation')}
            >
              <CardHeader className="text-center p-4">
                <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-base">Conversation</CardTitle>
              </CardHeader>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${selectedType === 'document' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedType('document')}
            >
              <CardHeader className="text-center p-4">
                <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-base">Document</CardTitle>
              </CardHeader>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${selectedType === 'image' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedType('image')}
            >
              <CardHeader className="text-center p-4">
                <Image className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-base">Image</CardTitle>
              </CardHeader>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${selectedType === 'code' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
              onClick={() => setSelectedType('code')}
            >
              <CardHeader className="text-center p-4">
                <Code className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-base">Code</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Creation Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedType === 'conversation' && 'New Conversation'}
                {selectedType === 'document' && 'AI Document Generator'}
                {selectedType === 'image' && 'AI Image Generator'}
                {selectedType === 'code' && 'Code Assistant'}
              </CardTitle>
              <CardDescription>
                {selectedType === 'conversation' && 'Start a new AI-powered conversation'}
                {selectedType === 'document' && 'Generate documents with AI assistance'}
                {selectedType === 'image' && 'Create images using AI models'}
                {selectedType === 'code' && 'Get help with coding tasks'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {selectedType === 'conversation' ? 'Conversation Title' : 
                   selectedType === 'document' ? 'Document Title' : 
                   selectedType === 'image' ? 'Image Description' : 
                   'Code Project Name'}
                </Label>
                <Input
                  id="title"
                  placeholder={
                    selectedType === 'conversation' ? 'Enter conversation title...' : 
                    selectedType === 'document' ? 'e.g., Business Proposal' : 
                    selectedType === 'image' ? 'e.g., Futuristic cityscape at sunset' : 
                    'e.g., Login System'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {(selectedType === 'document' || selectedType === 'code') && (
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder={
                      selectedType === 'document' 
                        ? 'Describe what you want in the document...' 
                        : 'Describe the functionality you need...'
                    }
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {selectedType === 'conversation' && (
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
              )}

              {selectedType === 'conversation' && isCollaborative && (
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
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {selectedType === 'conversation' ? 'Create Conversation' : 
                 selectedType === 'document' ? 'Generate Document' : 
                 selectedType === 'image' ? 'Generate Image' : 
                 'Start Coding'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
