import { ReactNode, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionDialog } from "./SubscriptionDialog";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionGateProps {
  children: ReactNode;
  /** What to show when locked. Defaults to an inline upgrade prompt. */
  fallback?: ReactNode;
  /** Feature label shown in the upgrade prompt */
  feature?: string;
}

/**
 * Wraps content that requires a Pro subscription.
 * Free users see an upgrade prompt instead.
 */
export function SubscriptionGate({ children, fallback, feature = "This feature" }: SubscriptionGateProps) {
  const { subscribed, loading } = useSubscription();
  const [showDialog, setShowDialog] = useState(false);

  if (loading) return null;

  if (subscribed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{feature} requires Pro</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade to OmePilot Pro to unlock this and all premium features.
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Crown className="h-4 w-4" /> Upgrade to Pro
        </Button>
      </div>
      <SubscriptionDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}

/**
 * Small inline lock badge that opens the subscription dialog on click.
 */
export function ProBadge({ label = "Pro" }: { label?: string }) {
  const { subscribed, loading } = useSubscription();
  const [showDialog, setShowDialog] = useState(false);

  if (loading || subscribed) return null;

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setShowDialog(true); }}
        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors"
      >
        <Lock className="h-3 w-3" />
        {label}
      </button>
      <SubscriptionDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}
