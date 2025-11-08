import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Plus, Trash2, Edit2, Save, X, Search, Download, Upload, Filter } from "lucide-react";
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
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMemory, setNewMemory] = useState({ key: '', value: '', category: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadMemories();
  }, []);

  useEffect(() => {
    filterMemories();
  }, [memories, searchQuery, categoryFilter]);

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
    
    // Extract unique categories
    const uniqueCategories = Array.from(new Set(data?.map(m => m.category).filter(Boolean) || []));
    setCategories(uniqueCategories);
  };

  const filterMemories = () => {
    let filtered = [...memories];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }

    setFilteredMemories(filtered);
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

  const exportMemories = () => {
    const dataStr = JSON.stringify(memories, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memories-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('Memories exported');
  };

  const importMemories = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedMemories = JSON.parse(text);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const memoriesToInsert = importedMemories.map((m: any) => ({
        user_id: user.id,
        key: m.key,
        value: m.value,
        category: m.category || ''
      }));

      const { error } = await supabase
        .from('user_memories')
        .insert(memoriesToInsert);

      if (error) {
        toast.error('Failed to import memories');
        return;
      }

      toast.success(`Imported ${memoriesToInsert.length} memories`);
      loadMemories();
    } catch (error) {
      toast.error('Invalid file format');
    }
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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

      {/* Search and Filter Section */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px] bg-background">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportMemories} size="icon" title="Export memories">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" title="Import memories" asChild>
                <label>
                  <Upload className="h-4 w-4" />
                  <input
                    type="file"
                    accept=".json"
                    onChange={importMemories}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {filteredMemories.length} of {memories.length} memories
          </div>
        </CardContent>
      </Card>

      {/* Memories List */}
      <div className="space-y-3">
        {filteredMemories.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center text-muted-foreground">
              {memories.length === 0 ? (
                <>
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No memories yet. Add your first memory above!</p>
                </>
              ) : (
                <p>No memories match your search.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredMemories.map((memory) => (
            <Card key={memory.id} className="bg-card border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {editingId === memory.id ? (
                  <div className="flex flex-col md:flex-row gap-2">
                    <Input
                      value={memory.key}
                      onChange={(e) => {
                        const updated = memories.map(m =>
                          m.id === memory.id ? { ...m, key: e.target.value } : m
                        );
                        setMemories(updated);
                      }}
                      className="bg-background"
                      placeholder="Key"
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
                      placeholder="Value"
                    />
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        onClick={() => updateMemory(memory.id, { key: memory.key, value: memory.value })}
                        title="Save"
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
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-primary">{memory.key}:</span>
                        <span className="text-foreground">{memory.value}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {memory.category && (
                          <Badge variant="secondary" className="text-xs">
                            {memory.category}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(memory.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingId(memory.id)}
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMemory(memory.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};