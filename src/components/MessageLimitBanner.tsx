import { useState } from "react";
import { Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SubscriptionDialog } from "@/components/SubscriptionDialog";

interface MessageLimitBannerProps {
  messagesSentToday: number;
  dailyLimit: number;
  remaining: number;
  limitReached: boolean;
  isUnlimited: boolean;
  loading: boolean;
}

export function MessageLimitBanner({
  messagesSentToday,
  dailyLimit,
  remaining,
  limitReached,
  isUnlimited,
  loading,
}: MessageLimitBannerProps) {
  const [showDialog, setShowDialog] = useState(false);

  if (loading || isUnlimited) return null;

  const percentage = Math.min(100, (messagesSentToday / dailyLimit) * 100);
  const isLow = remaining <= 5 && remaining > 0;

  if (!limitReached && !isLow) return null;

  return (
    <>
      <div
        className={`mx-4 mt-2 rounded-lg border px-4 py-3 flex items-center gap-3 text-sm ${
          limitReached
            ? "border-destructive/30 bg-destructive/5 text-destructive"
            : "border-yellow-500/30 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400"
        }`}
      >
        <Zap className="h-4 w-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium">
              {limitReached
                ? "Daily message limit reached"
                : `${remaining} message${remaining === 1 ? "" : "s"} remaining today`}
            </span>
            <span className="text-xs text-muted-foreground">
              {messagesSentToday}/{dailyLimit}
            </span>
          </div>
          <Progress value={percentage} className="h-1.5" />
        </div>
        <Button
          size="sm"
          variant={limitReached ? "default" : "outline"}
          onClick={() => setShowDialog(true)}
          className="gap-1 flex-shrink-0"
        >
          <Crown className="h-3 w-3" />
          Upgrade
        </Button>
      </div>
      <SubscriptionDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  );
}
