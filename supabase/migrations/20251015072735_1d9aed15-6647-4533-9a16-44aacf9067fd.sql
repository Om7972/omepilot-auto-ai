-- Add conversation_members table for collaborative sessions
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Add user_id to messages to track who sent each message
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add is_collaborative flag to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS is_collaborative BOOLEAN DEFAULT false;

-- Enable RLS on conversation_members
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- Policies for conversation_members
CREATE POLICY "Users can view members of their conversations"
  ON public.conversation_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Conversation owners can add members"
  ON public.conversation_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_members.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can leave conversations"
  ON public.conversation_members FOR DELETE
  USING (auth.uid() = user_id);

-- Update conversations policies for collaborative access
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own and shared conversations"
  ON public.conversations FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

-- Update messages policies for collaborative access
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their and shared conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (
        c.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.conversation_members cm
          WHERE cm.conversation_id = c.id
          AND cm.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.messages;
CREATE POLICY "Users can create messages in their and shared conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (
        c.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.conversation_members cm
          WHERE cm.conversation_id = c.id
          AND cm.user_id = auth.uid()
        )
      )
    )
  );

-- Enable realtime for collaborative features
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;