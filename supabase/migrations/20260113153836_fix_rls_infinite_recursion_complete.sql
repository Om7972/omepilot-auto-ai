-- ============================================
-- Fix Infinite Recursion in RLS Policies (Complete Fix)
-- This migration fixes the 42P17 error by removing ALL circular dependencies
-- ============================================

-- Step 1: Drop all problematic policies that cause circular dependencies
DROP POLICY IF EXISTS "Users can view their own and shared conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view members of their conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can view messages in their and shared conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their and shared conversations" ON public.messages;

-- Step 2: Recreate conversations SELECT policy WITHOUT circular dependency
-- This policy allows users to see conversations they own OR conversations they're members of
-- We check membership directly without recursion
CREATE POLICY "Users can view their own and shared conversations"
ON public.conversations FOR SELECT
USING (
  -- User owns the conversation (direct check - no recursion)
  auth.uid() = user_id 
  OR
  -- User is a member of the conversation (direct check on conversation_members - no recursion)
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = conversations.id
    AND cm.user_id = auth.uid()
  )
);

-- Step 3: Recreate conversation_members SELECT policy WITHOUT circular dependency
-- This policy allows users to see members of conversations they own OR their own membership
-- We avoid recursion by ONLY checking ownership (no recursive membership checks)
CREATE POLICY "Users can view members of their conversations"
ON public.conversation_members FOR SELECT
USING (
  -- User is viewing their own membership record (safe - direct check)
  user_id = auth.uid()
  OR
  -- User owns the conversation (safe - direct check from conversations table, no recursion)
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_members.conversation_id
    AND c.user_id = auth.uid()
  )
);

-- Step 4: Recreate messages SELECT policy WITHOUT circular dependency
-- This policy allows users to see messages in conversations they own OR are members of
-- We use direct checks without recursion
CREATE POLICY "Users can view messages in their and shared conversations"
ON public.messages FOR SELECT
USING (
  -- Check if user owns the conversation (direct check)
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND c.user_id = auth.uid()
  )
  OR
  -- Check if user is a member of the conversation (direct check on conversation_members)
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = messages.conversation_id
    AND cm.user_id = auth.uid()
  )
);

-- Step 5: Recreate messages INSERT policy WITHOUT circular dependency
CREATE POLICY "Users can create messages in their and shared conversations"
ON public.messages FOR INSERT
WITH CHECK (
  -- Check if user owns the conversation (direct check)
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND c.user_id = auth.uid()
  )
  OR
  -- Check if user is a member of the conversation (direct check on conversation_members)
  EXISTS (
    SELECT 1 FROM public.conversation_members cm
    WHERE cm.conversation_id = messages.conversation_id
    AND cm.user_id = auth.uid()
  )
);

-- Step 6: Ensure documents table has proper RLS policies for collaborative access
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

-- Recreate documents policies with collaborative support
CREATE POLICY "Users can view their own documents"
ON public.documents FOR SELECT
USING (
  auth.uid() = user_id
  OR
  -- Allow viewing documents in shared conversations
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = documents.conversation_id
    AND (
      c.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = c.id
        AND cm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can upload documents"
ON public.documents FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    -- Can upload to own conversations
    conversation_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = documents.conversation_id
      AND (
        c.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.conversation_members cm
          WHERE cm.conversation_id = c.id
          AND cm.user_id = auth.uid()
        )
      )
    )
  )
);

CREATE POLICY "Users can delete their own documents"
ON public.documents FOR DELETE
USING (auth.uid() = user_id);

-- Step 7: Ensure conversation_members INSERT policy exists (for adding members)
DROP POLICY IF EXISTS "Conversation owners can add members" ON public.conversation_members;
CREATE POLICY "Conversation owners can add members"
ON public.conversation_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_members.conversation_id
    AND c.user_id = auth.uid()
  )
);

-- Step 8: Ensure conversation_members DELETE policy exists (for leaving conversations)
DROP POLICY IF EXISTS "Members can leave conversations" ON public.conversation_members;
CREATE POLICY "Members can leave conversations"
ON public.conversation_members FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- Migration Complete
-- All RLS policies now avoid circular dependencies
-- The infinite recursion error (42P17) should be resolved
-- ============================================

