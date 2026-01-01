import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Send, ThumbsUp, ThumbsDown, Meh } from "lucide-react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const [rating, setRating] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission (in production, send to backend)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Thank you for your feedback!");
    setRating("");
    setFeedback("");
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Give Feedback</DialogTitle>
          <DialogDescription>
            Help us improve Omepilot by sharing your experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5">
          <div className="space-y-3">
            <Label>How would you rate your experience?</Label>
            <RadioGroup value={rating} onValueChange={setRating} className="flex gap-4 justify-center">
              <div className="flex flex-col items-center gap-2">
                <RadioGroupItem value="negative" id="negative" className="peer sr-only" />
                <Label 
                  htmlFor="negative" 
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-muted peer-data-[state=checked]:border-destructive peer-data-[state=checked]:bg-destructive/10"
                >
                  <ThumbsDown className="h-6 w-6" />
                  <span className="text-xs">Poor</span>
                </Label>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <RadioGroupItem value="neutral" id="neutral" className="peer sr-only" />
                <Label 
                  htmlFor="neutral" 
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-muted peer-data-[state=checked]:border-yellow-500 peer-data-[state=checked]:bg-yellow-500/10"
                >
                  <Meh className="h-6 w-6" />
                  <span className="text-xs">Okay</span>
                </Label>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <RadioGroupItem value="positive" id="positive" className="peer sr-only" />
                <Label 
                  htmlFor="positive" 
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-muted peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-500/10"
                >
                  <ThumbsUp className="h-6 w-6" />
                  <span className="text-xs">Great</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Tell us more (optional)</Label>
            <Textarea
              id="feedback"
              placeholder="What do you like? What could be better?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !rating}
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
