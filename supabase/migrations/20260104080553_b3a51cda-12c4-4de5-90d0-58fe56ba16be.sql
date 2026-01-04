-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create user_stats table for gamification (points, streaks, badges)
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  conversations_created INTEGER NOT NULL DEFAULT 0,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own stats" 
ON public.user_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" 
ON public.user_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" 
ON public.user_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create message_feedback table for rating AI responses
CREATE TABLE public.message_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own feedback" 
ON public.message_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" 
ON public.message_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update user stats
CREATE OR REPLACE FUNCTION public.update_user_stats_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_date_val DATE := CURRENT_DATE;
BEGIN
  -- Only count user messages
  IF NEW.role = 'user' AND NEW.user_id IS NOT NULL THEN
    -- Get or create user stats
    INSERT INTO public.user_stats (user_id, last_activity_date, messages_sent, total_points)
    VALUES (NEW.user_id, current_date_val, 1, 10)
    ON CONFLICT (user_id) DO UPDATE SET
      messages_sent = user_stats.messages_sent + 1,
      total_points = user_stats.total_points + 10,
      last_activity_date = CASE 
        WHEN user_stats.last_activity_date < current_date_val THEN current_date_val 
        ELSE user_stats.last_activity_date 
      END,
      current_streak = CASE
        WHEN user_stats.last_activity_date = current_date_val - 1 THEN user_stats.current_streak + 1
        WHEN user_stats.last_activity_date < current_date_val - 1 THEN 1
        ELSE user_stats.current_streak
      END,
      longest_streak = GREATEST(
        user_stats.longest_streak,
        CASE
          WHEN user_stats.last_activity_date = current_date_val - 1 THEN user_stats.current_streak + 1
          WHEN user_stats.last_activity_date < current_date_val - 1 THEN 1
          ELSE user_stats.current_streak
        END
      ),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-updating stats
CREATE TRIGGER update_stats_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_user_stats_on_message();

-- Create trigger for updated_at
CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();