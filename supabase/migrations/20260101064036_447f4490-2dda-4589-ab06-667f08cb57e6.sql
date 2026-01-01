-- Fix profiles table exposure - require authentication for SELECT
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Prevent quiz attempt score tampering
CREATE POLICY "Prevent quiz score updates" 
ON public.quiz_attempts FOR UPDATE 
USING (false);

-- Prevent quiz attempt deletion
CREATE POLICY "Prevent quiz attempt deletion" 
ON public.quiz_attempts FOR DELETE 
USING (false);

-- Allow messages update for own messages
CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow messages delete for own messages  
CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
USING (auth.uid() = user_id);