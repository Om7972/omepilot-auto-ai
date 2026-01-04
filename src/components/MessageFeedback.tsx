import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MessageFeedbackProps {
  messageId: string;
  existingRating?: "positive" | "negative" | null;
}

export const MessageFeedback = ({ messageId, existingRating }: MessageFeedbackProps) => {
  const [rating, setRating] = useState<"positive" | "negative" | null>(existingRating || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (newRating: "positive" | "negative") => {
    if (isSubmitting || rating === newRating) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to provide feedback");
        return;
      }

      const { error } = await supabase
        .from("message_feedback")
        .insert({
          message_id: messageId,
          user_id: user.id,
          rating: newRating,
        });

      if (error) {
        if (error.code === "23505") {
          toast.info("You've already rated this message");
        } else {
          throw error;
        }
        return;
      }

      setRating(newRating);
      toast.success(newRating === "positive" ? "Thanks for the feedback! 👍" : "Thanks for the feedback! We'll improve.");
    } catch (error) {
      console.error("Feedback error:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => handleFeedback("positive")}
        disabled={isSubmitting}
        className={cn(
          "h-7 w-7 rounded-full",
          rating === "positive" && "bg-green-500/20 text-green-600"
        )}
        title="Good response"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => handleFeedback("negative")}
        disabled={isSubmitting}
        className={cn(
          "h-7 w-7 rounded-full",
          rating === "negative" && "bg-red-500/20 text-red-600"
        )}
        title="Poor response"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
