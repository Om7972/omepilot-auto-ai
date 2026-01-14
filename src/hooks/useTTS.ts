import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseTTSOptions {
  voiceId?: string;
}

export function useTTS(options: UseTTSOptions = {}) {
  const { voiceId = "JBFqnCBsd6RMkjVDRZzb" } = options;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) {
      toast.error("No text to speak");
      return;
    }

    // Stop any current playback
    stop();
    
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to use text-to-speech");
        return;
      }

      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
      
      const response = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        let errorMessage = "TTS generation failed";
        
        if (contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // ignore parse error
          }
        }
        
        if (response.status === 402) {
          toast.error("ElevenLabs quota exceeded. Please add credits to your account.");
        } else if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      currentUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        if (currentUrlRef.current) {
          URL.revokeObjectURL(currentUrlRef.current);
          currentUrlRef.current = null;
        }
      };

      audio.onerror = () => {
        setIsPlaying(false);
        toast.error("Audio playback failed");
      };

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("TTS error:", error);
      toast.error("Failed to generate speech");
    } finally {
      setIsLoading(false);
    }
  }, [voiceId, stop]);

  const toggle = useCallback((text: string) => {
    if (isPlaying) {
      stop();
    } else {
      speak(text);
    }
  }, [isPlaying, speak, stop]);

  return {
    speak,
    stop,
    toggle,
    isPlaying,
    isLoading,
  };
}
