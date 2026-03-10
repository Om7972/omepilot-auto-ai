import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, ThumbsUp, ThumbsDown, Meh, Star, Sparkles, CheckCircle2, MessageCircle, Zap, Bug, Lightbulb, Heart } from "lucide-react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  { value: "general", label: "General Feedback", icon: MessageCircle },
  { value: "feature", label: "Feature Request", icon: Lightbulb },
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "performance", label: "Performance", icon: Zap },
  { value: "design", label: "Design & UX", icon: Sparkles },
];

export const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState<string>("");
  const [starRating, setStarRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [feedback, setFeedback] = useState("");
  const [featureSatisfaction, setFeatureSatisfaction] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const features = [
    { id: "ai-chat", label: "AI Chat Quality" },
    { id: "document", label: "Document Analysis" },
    { id: "ui", label: "User Interface" },
    { id: "speed", label: "Speed & Performance" },
  ];

  const handleSubmit = async () => {
    if (!rating && starRating === 0) {
      toast.error("Please provide a rating");
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setRating("");
      setStarRating(0);
      setCategory("");
      setTitle("");
      setFeedback("");
      setFeatureSatisfaction({});
      setSubmitted(false);
    }, 200);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="text-center py-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground text-sm mb-1">
              Your feedback helps us build a better OmePilot.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              We read every piece of feedback and use it to prioritize improvements.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve OmePilot — every response matters
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-5">
            {/* Overall Rating */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">How would you rate your overall experience?</Label>
              <RadioGroup value={rating} onValueChange={setRating} className="flex gap-4 justify-center">
                {[
                  { value: "negative", icon: ThumbsDown, label: "Poor", activeClass: "border-destructive bg-destructive/10" },
                  { value: "neutral", icon: Meh, label: "Okay", activeClass: "border-yellow-500 bg-yellow-500/10" },
                  { value: "positive", icon: ThumbsUp, label: "Great", activeClass: "border-green-500 bg-green-500/10" },
                ].map((item) => (
                  <div key={item.value} className="flex flex-col items-center gap-2">
                    <RadioGroupItem value={item.value} id={item.value} className="peer sr-only" />
                    <Label
                      htmlFor={item.value}
                      className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-muted ${
                        rating === item.value ? item.activeClass : "border-border"
                      }`}
                    >
                      <item.icon className="h-7 w-7" />
                      <span className="text-xs font-medium">{item.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Star Rating */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rate us out of 5 stars</Label>
              <div className="flex gap-1 justify-center py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setStarRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        star <= (hoveredStar || starRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {starRating > 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  {starRating === 5 ? "Excellent!" : starRating === 4 ? "Very good!" : starRating === 3 ? "Good" : starRating === 2 ? "Fair" : "We'll do better"}
                </p>
              )}
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!rating && starRating === 0}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {/* Feature Satisfaction */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Rate specific features</Label>
              <div className="space-y-2">
                {features.map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="text-sm">{feature.label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeatureSatisfaction(prev => ({ ...prev, [feature.id]: String(star) }))}
                          className="p-0.5"
                        >
                          <Star
                            className={`h-4 w-4 transition-colors ${
                              star <= Number(featureSatisfaction[feature.id] || 0)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Feedback category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-3.5 w-3.5" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Title (optional)</Label>
              <Input
                id="title"
                placeholder="Brief summary of your feedback"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-sm font-medium">Your feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Tell us what you love, what could be better, or any ideas you have for new features..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {feedback.length}/1000 characters
              </p>
            </div>

            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                Your feedback is anonymous and helps our team prioritize improvements. We review every submission.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
