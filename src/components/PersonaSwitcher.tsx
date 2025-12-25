import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Zap, Brain, GraduationCap, Search, ChevronDown } from "lucide-react";

interface Persona {
  id: string;
  name: string;
  description: string;
  icon: any;
}

interface PersonaSwitcherProps {
  selectedPersona: string;
  onPersonaChange: (persona: string) => void;
}

const PERSONAS: Persona[] = [
  {
    id: 'gpt-5',
    name: 'Smart (GPT-5)',
    description: 'Thinks deeply with advanced reasoning',
    icon: Sparkles,
  },
  {
    id: 'gemini',
    name: 'Quick response',
    description: 'Best for everyday conversation',
    icon: Zap,
  },
  {
    id: 'deep',
    name: 'Think Deeper',
    description: 'Better for more complex topics',
    icon: Brain,
  },
  {
    id: 'learn',
    name: 'Study and learn',
    description: 'Quizzes, guided learning, and more',
    icon: GraduationCap,
  },
  {
    id: 'search',
    name: 'Search',
    description: 'Answers with enhanced references',
    icon: Search,
  },
];

export const PersonaSwitcher = ({ selectedPersona, onPersonaChange }: PersonaSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentPersona = PERSONAS.find(p => p.id === selectedPersona) || PERSONAS[0];
  const Icon = currentPersona.icon;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="gap-2 hover:bg-accent px-3 h-auto py-2"
        >
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{currentPersona.name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 bg-card/95 backdrop-blur-sm border-border/50 shadow-xl">
        {PERSONAS.map((persona) => {
          const PersonaIcon = persona.icon;
          return (
            <DropdownMenuItem
              key={persona.id}
              onClick={() => {
                onPersonaChange(persona.id);
                setIsOpen(false);
              }}
              className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent/50 focus:bg-accent/50"
            >
              <PersonaIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-sm">{persona.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{persona.description}</div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};