import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface Persona {
  id: string;
  name: string;
  description: string;
  icon: string;
  system_prompt: string;
  model: string;
}

interface PersonaSwitcherProps {
  selectedPersona: Persona | null;
  onPersonaChange: (persona: Persona) => void;
}

export const PersonaSwitcher = ({ selectedPersona, onPersonaChange }: PersonaSwitcherProps) => {
  const [personas, setPersonas] = useState<Persona[]>([]);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading personas:', error);
      return;
    }

    setPersonas(data || []);
    
    // Set default persona if none selected
    if (!selectedPersona && data && data.length > 0) {
      onPersonaChange(data[0]);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 bg-card border-border hover:bg-muted"
        >
          <span className="text-lg">{selectedPersona?.icon || '🤖'}</span>
          <span className="hidden sm:inline">{selectedPersona?.name || 'Select AI'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card border-border z-50">
        <DropdownMenuLabel>Choose AI Persona</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {personas.map((persona) => (
          <DropdownMenuItem
            key={persona.id}
            onClick={() => {
              onPersonaChange(persona);
              toast.success(`Switched to ${persona.name}`);
            }}
            className="flex items-start gap-3 p-3 cursor-pointer"
          >
            <span className="text-2xl">{persona.icon}</span>
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                {persona.name}
                {selectedPersona?.id === persona.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">{persona.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};