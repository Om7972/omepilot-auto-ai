import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentExtractedTextProps {
  documentId: string;
}

export const DocumentExtractedText = ({ documentId }: DocumentExtractedTextProps) => {
  const [text, setText] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchText = async () => {
      const { data } = await supabase
        .from("documents")
        .select("extracted_text")
        .eq("id", documentId)
        .single();

      setText(data?.extracted_text || null);
      setLoading(false);
    };
    fetchText();
  }, [documentId]);

  if (loading || !text) return null;

  const preview = text.length > 150 ? text.slice(0, 150) + "…" : text;

  return (
    <div className="mt-2 w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
      >
        <FileText className="h-3 w-3" />
        {expanded ? "Hide" : "Show"} extracted text
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>
      {expanded && (
        <div className="mt-1 rounded-lg bg-background/30 backdrop-blur-sm p-3 text-xs max-h-48 overflow-y-auto whitespace-pre-wrap text-muted-foreground border border-border/30">
          {text}
        </div>
      )}
    </div>
  );
};
