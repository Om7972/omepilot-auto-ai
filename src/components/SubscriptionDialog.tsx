import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Crown, Loader2, ExternalLink, Settings } from "lucide-react";
import { toast } from "sonner";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/useSubscription";
import { useState } from "react";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Zap,
    features: [
      "100 messages/day",
      "Basic AI models",
      "5 conversations",
      "Community support",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$19",
    period: "per month",
    icon: Sparkles,
    popular: true,
    priceId: SUBSCRIPTION_TIERS.pro.price_id,
    features: [
      "Unlimited messages",
      "All AI models",
      "Unlimited conversations",
      "Priority support",
      "Collaborative sessions",
      "Document analysis",
      "Quiz generation",
    ],
  },
  {
    key: "enterprise",
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
      "Custom integrations",
    ],
  },
];

export function SubscriptionDialog({ open, onOpenChange }: SubscriptionDialogProps) {
  const { currentTier, subscribed, subscriptionEnd, loading, createCheckout, openCustomerPortal, checkSubscription } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleUpgrade = async (planKey: string, priceId?: string) => {
    if (planKey === "enterprise") {
      toast.info("Please contact our sales team for Enterprise pricing.");
      return;
    }
    if (!priceId) return;

    setCheckoutLoading(planKey);
    try {
      await createCheckout(priceId);
      toast.success("Redirecting to checkout...");
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } catch {
      toast.error("Failed to open subscription portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-lg font-semibold capitalize">
                  {loading ? "Loading..." : `${currentTier === "free" ? "Free" : "Pro"} Plan`}
                </p>
                {subscribed && subscriptionEnd && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Renews on {formatDate(subscriptionEnd)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={subscribed ? "default" : "secondary"}>
                  {subscribed ? "Active" : "Free Tier"}
                </Badge>
                {subscribed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="gap-1"
                  >
                    {portalLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Settings className="h-3 w-3" />
                    )}
                    Manage
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => checkSubscription()}
                  className="text-xs text-muted-foreground"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = plan.key === currentTier;
              const isUpgrade = !isCurrent && plan.key !== "free";

              return (
                <div
                  key={plan.key}
                  className={`relative rounded-xl border p-5 transition-all ${
                    isCurrent
                      ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                      : plan.popular
                        ? "border-primary/50 bg-primary/[0.02] shadow-md hover:shadow-lg"
                        : "border-border hover:border-primary/50 hover:shadow-md"
                  }`}
                >
                  {plan.popular && !isCurrent && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                      Your Plan
                    </Badge>
                  )}

                  <div className="text-center mb-4 pt-2">
                    <plan.icon
                      className={`h-8 w-8 mx-auto mb-2 ${
                        isCurrent ? "text-primary" : plan.popular ? "text-primary/80" : "text-muted-foreground"
                      }`}
                    />
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

                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : plan.key === "enterprise" ? (
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => handleUpgrade("enterprise")}
                    >
                      Contact Sales
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      className="w-full gap-1"
                      onClick={() => handleUpgrade(plan.key, plan.priceId)}
                      disabled={checkoutLoading === plan.key}
                    >
                      {checkoutLoading === plan.key ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Upgrade
                          <ExternalLink className="h-3 w-3" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Free Plan
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
