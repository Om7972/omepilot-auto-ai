-- Remove the overly broad policy
DROP POLICY IF EXISTS "Authenticated users can view leaderboard stats" ON public.user_stats;

-- Recreate the view without security_invoker so it uses definer context
DROP VIEW IF EXISTS public.leaderboard_view;

-- Create a security definer function to fetch leaderboard data
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  username text,
  total_points integer,
  current_streak integer,
  longest_streak integer,
  messages_sent integer,
  badges jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  ORDER BY us.total_points DESC
  LIMIT limit_count;
$$;

-- Recreate the view using the function (for backward compatibility with types)
CREATE VIEW public.leaderboard_view AS
SELECT * FROM public.get_leaderboard(100);
