-- Fix infinite recursion using security definer functions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own and shared conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view members of their conversations" ON conversation_members;

-- Create security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversation_members
    WHERE conversation_id = _conversation_id
    AND user_id = _user_id
  );
$$;

-- Create security definer function to check conversation ownership
CREATE OR REPLACE FUNCTION public.is_conversation_owner(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM conversations
    WHERE id = _conversation_id
    AND user_id = _user_id
  );
$$;

-- Recreate conversations SELECT policy using security definer function
CREATE POLICY "Users can view their own and shared conversations"
ON conversations FOR SELECT
USING (
  auth.uid() = user_id OR
  public.is_conversation_member(id, auth.uid())
);

-- Recreate conversation_members SELECT policy using security definer function
CREATE POLICY "Users can view members of their conversations"
ON conversation_members FOR SELECT
USING (
  user_id = auth.uid() OR
  public.is_conversation_owner(conversation_id, auth.uid()) OR
  public.is_conversation_member(conversation_id, auth.uid())
);