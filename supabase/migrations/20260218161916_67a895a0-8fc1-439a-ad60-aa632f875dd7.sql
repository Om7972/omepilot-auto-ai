-- Enable RLS on leaderboard_view by recreating it as a security-definer view
-- Views don't support RLS directly, so we wrap access in a function

-- Drop and recreate the view with security_invoker = true so RLS applies
DROP VIEW IF EXISTS public.leaderboard_view;

CREATE VIEW public.leaderboard_view
WITH (security_invoker = true)
AS
SELECT
  us.user_id,
  p.username,
  us.total_points,
  us.current_streak,
  us.longest_streak,
  us.messages_sent,
  us.badges
FROM public.user_stats us
LEFT JOIN public.profiles p ON p.id = us.user_id
ORDER BY us.total_points DESC;

-- RLS on user_stats already requires auth (users can view own stats)
-- We need a policy that allows authenticated users to see all stats for leaderboard
-- Add a SELECT policy for authenticated users on user_stats
CREATE POLICY "Authenticated users can view leaderboard stats"
ON public.user_stats
FOR SELECT
USING (auth.uid() IS NOT NULL);
