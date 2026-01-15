-- Fix overly permissive INSERT policy on notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a more restrictive policy - only authenticated users or system can insert
CREATE POLICY "Authenticated users can receive notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);