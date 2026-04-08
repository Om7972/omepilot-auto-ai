import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";

interface Props {
  text: string;
}

export const ReadAloudButton = ({ text }: Props) => {
  const { toggle, isPlaying, isLoading } = useTTS();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggle(text)}
      disabled={isLoading}
      className="gap-1.5"
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-3.5 w-3.5" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
      {isLoading ? "Loading..." : isPlaying ? "Stop" : "Read aloud"}
    </Button>
  );
};
