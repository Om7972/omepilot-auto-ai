-- Add is_pinned column to conversations for pin feature
ALTER TABLE public.conversations 
ADD COLUMN is_pinned boolean DEFAULT false;

-- Add share_token for shareable links
ALTER TABLE public.conversations 
ADD COLUMN share_token text UNIQUE;

-- Security Fix 1: Ensure profiles table requires authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Security Fix 2: Ensure plugins table requires authentication
DROP POLICY IF EXISTS "Users can view public plugins and their own" ON public.plugins;
CREATE POLICY "Authenticated users can view public plugins and their own"
  ON public.plugins FOR SELECT
  USING (auth.uid() IS NOT NULL AND (is_public = true OR auth.uid() = user_id));

-- Security Fix 3: Mark personas as system-only (restrict to default personas only)  
DROP POLICY IF EXISTS "Authenticated users can view personas" ON public.personas;
CREATE POLICY "Users can view default personas only"
  ON public.personas FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_default = true);

-- Create function to generate share token
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS text
LANGUAGE sql
AS $$
  SELECT encode(gen_random_bytes(16), 'hex');
$$;