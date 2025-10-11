import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const inspirationalQuotes = [
  "Dream big, create bigger",
  "Imagination is the beginning of creation",
  "Every artist was first an amateur",
  "Creativity is intelligence having fun",
  "The best way to predict the future is to create it",
];

export const CreatorGallery = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuote] = useState(inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to generate an image');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: prompt.trim() }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      if (data.success && data.imageUrl) {
        setImageUrl(data.imageUrl);
        toast.success('Image generated successfully!');
      } else {
        console.error('Generation failed:', data);
        toast.error(data.error || 'Failed to generate image. Please check the logs.');
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast.error(error.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omepilot-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Creator Gallery</h1>
        <p className="text-lg text-primary italic">"{currentQuote}"</p>
      </div>

      <div className="flex gap-2 mb-6">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your image... (e.g., 'A futuristic city at sunset')"
          className="flex-1 bg-card border-input"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <Button 
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="px-6"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate
            </>
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {imageUrl ? (
          <Card className="p-4 bg-card">
            <div className="relative group">
              <img 
                src={imageUrl} 
                alt="Generated artwork" 
                className="w-full rounded-lg shadow-lg"
              />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={handleDownload}
                  size="icon"
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="font-semibold">Prompt:</span> {prompt}
            </p>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <Sparkles className="h-16 w-16 mx-auto text-primary opacity-50" />
              <div>
                <p className="text-lg font-medium text-foreground">Ready to create something amazing?</p>
                <p className="text-muted-foreground">Enter a prompt above to generate your image</p>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
