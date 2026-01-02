import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Zap,
    current: true,
    features: [
      "100 messages/day",
      "Basic AI models",
      "5 conversations",
      "Community support"
    ]
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    icon: Sparkles,
    popular: true,
    features: [
      "Unlimited messages",
      "All AI models",
      "Unlimited conversations",
      "Priority support",
      "Collaborative sessions",
      "Document analysis",
      "Quiz generation"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    icon: Crown,
    features: [
      "Everything in Pro",
      "Custom AI training",
      "API access",
      "Dedicated support",
      "SSO integration",
      "Analytics dashboard",
      "Custom integrations"
    ]
  }
];

export function SubscriptionDialog({ open, onOpenChange }: SubscriptionDialogProps) {
  const handleUpgrade = (planName: string) => {
    toast.info(`Upgrade to ${planName} coming soon!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-primary" />
            Manage Subscription
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Current Plan Banner */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-lg font-semibold">Free Plan</p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-5 transition-all ${
                  plan.popular 
                    ? 'border-primary bg-primary/5 shadow-lg' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}

                <div className="text-center mb-4 pt-2">
                  <plan.icon className={`h-8 w-8 mx-auto mb-2 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.current ? "outline" : plan.popular ? "default" : "secondary"}
                  onClick={() => !plan.current && handleUpgrade(plan.name)}
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : plan.name === "Enterprise" ? "Contact Sales" : "Upgrade"}
                </Button>
              </div>
            ))}
          </div>

          {/* Usage Stats */}
          <div className="mt-6 p-4 rounded-xl bg-muted/50">
            <h4 className="font-medium mb-3">This Month's Usage</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">47</p>
                <p className="text-xs text-muted-foreground">Messages</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">3</p>
                <p className="text-xs text-muted-foreground">Conversations</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">2</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">1</p>
                <p className="text-xs text-muted-foreground">Quizzes</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}