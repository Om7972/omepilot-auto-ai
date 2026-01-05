-- Create a view for public leaderboard data (only non-sensitive stats)
CREATE OR REPLACE VIEW public.leaderboard_view AS
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

-- Create RLS policy for viewing leaderboard (all authenticated users can see)
CREATE POLICY "Authenticated users can view leaderboard"
ON public.user_stats
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Drop the old restrictive policy if it exists (we'll keep it more open for leaderboard)
DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_stats;

-- Add user_preferences table for settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  auto_save_conversations BOOLEAN DEFAULT true,
  voice_mode TEXT DEFAULT 'browser',
  default_ai_model TEXT DEFAULT 'gemini',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();