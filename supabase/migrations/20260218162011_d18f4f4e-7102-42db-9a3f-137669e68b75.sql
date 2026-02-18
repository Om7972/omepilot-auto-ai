-- Drop the security definer view and recreate with security_invoker
DROP VIEW IF EXISTS public.leaderboard_view;

-- Recreate as security invoker view (uses caller's permissions)
CREATE VIEW public.leaderboard_view
WITH (security_invoker = true)
AS
SELECT * FROM public.get_leaderboard(100);
