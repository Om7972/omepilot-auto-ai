-- Fix SECURITY DEFINER function - switch to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- Restrict personas table - only authenticated users can view
DROP POLICY IF EXISTS "Anyone can view personas" ON public.personas;
CREATE POLICY "Authenticated users can view personas"
  ON public.personas FOR SELECT
  USING (auth.uid() IS NOT NULL);