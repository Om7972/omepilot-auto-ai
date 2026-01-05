-- Drop the SECURITY DEFINER view and recreate as regular view
DROP VIEW IF EXISTS public.leaderboard_view;

-- Create view without SECURITY DEFINER (default is SECURITY INVOKER which is safe)
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
LEFT JOIN public.profiles p ON us.user_id = p.id
ORDER BY us.total_points DESC
LIMIT 100;