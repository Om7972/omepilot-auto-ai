import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Memory {
  id: string;
  key: string;
  value: string;
  category: string;
  created_at: string;
}

export const MemoryManager = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMemory, setNewMemory] = useState({ key: '', value: '', category: '' });

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    const { data, error } = await supabase
      .from('user_memories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading memories:', error);
      return;
    }

    setMemories(data || []);
  };

  const addMemory = async () => {
    if (!newMemory.key.trim() || !newMemory.value.trim()) {
      toast.error('Key and value are required');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_memories')
      .insert({
        user_id: user.id,
        ...newMemory
      });

    if (error) {
      toast.error('Failed to add memory');
      return;
    }

    toast.success('Memory added');
    setNewMemory({ key: '', value: '', category: '' });
    loadMemories();
  };

  const deleteMemory = async (id: string) => {
    const { error } = await supabase
      .from('user_memories')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete memory');
      return;
    }

    toast.success('Memory deleted');
    loadMemories();
  };

  const updateMemory = async (id: string, updates: Partial<Memory>) => {
    const { error } = await supabase
      .from('user_memories')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update memory');
      return;
    }

    toast.success('Memory updated');
    setEditingId(null);
    loadMemories();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Memory Management
          </CardTitle>
          <CardDescription>
            Teach the AI to remember important information about you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  placeholder="Name"
                  value={newMemory.key}
                  onChange={(e) => setNewMemory({ ...newMemory, key: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div>
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  placeholder="John Doe"
                  value={newMemory.value}
                  onChange={(e) => setNewMemory({ ...newMemory, value: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="Personal"
                  value={newMemory.category}
                  onChange={(e) => setNewMemory({ ...newMemory, category: e.target.value })}
                  className="bg-background"
                />
              </div>
            </div>
            <Button onClick={addMemory} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Memory
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {memories.map((memory) => (
          <Card key={memory.id} className="bg-card border-border">
            <CardContent className="p-4">
              {editingId === memory.id ? (
                <div className="flex gap-2">
                  <Input
                    value={memory.key}
                    onChange={(e) => {
                      const updated = memories.map(m =>
                        m.id === memory.id ? { ...m, key: e.target.value } : m
                      );
                      setMemories(updated);
                    }}
                    className="bg-background"
                  />
                  <Input
                    value={memory.value}
                    onChange={(e) => {
                      const updated = memories.map(m =>
                        m.id === memory.id ? { ...m, value: e.target.value } : m
                      );
                      setMemories(updated);
                    }}
                    className="bg-background"
                  />
                  <Button
                    size="icon"
                    onClick={() => updateMemory(memory.id, { key: memory.key, value: memory.value })}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null);
                      loadMemories();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-primary">{memory.key}:</span>
                      <span className="text-foreground">{memory.value}</span>
                    </div>
                    {memory.category && (
                      <Badge variant="secondary" className="text-xs">
                        {memory.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingId(memory.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMemory(memory.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};