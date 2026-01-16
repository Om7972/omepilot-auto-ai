-- Fix overly permissive profiles SELECT policy
-- Restrict profile access to: own profile OR users in shared conversations

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create a security definer function to check if users share a conversation
CREATE OR REPLACE FUNCTION public.shares_conversation_with(_viewer_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check if both users are members of the same conversation
    SELECT 1 FROM conversation_members cm1
    JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
    WHERE cm1.user_id = _viewer_id AND cm2.user_id = _profile_id
  )
  OR EXISTS (
    -- Check if viewer owns a conversation that profile_id is a member of
    SELECT 1 FROM conversations c
    JOIN conversation_members cm ON cm.conversation_id = c.id
    WHERE c.user_id = _viewer_id AND cm.user_id = _profile_id
  )
  OR EXISTS (
    -- Check if profile_id owns a conversation that viewer is a member of
    SELECT 1 FROM conversations c
    JOIN conversation_members cm ON cm.conversation_id = c.id
    WHERE c.user_id = _profile_id AND cm.user_id = _viewer_id
  );
$$;

-- Create restricted policy: users can only view their own profile or profiles of users in shared conversations
CREATE POLICY "Users can view related profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id  -- Own profile
    OR public.shares_conversation_with(auth.uid(), id)  -- Users in shared conversations
  );