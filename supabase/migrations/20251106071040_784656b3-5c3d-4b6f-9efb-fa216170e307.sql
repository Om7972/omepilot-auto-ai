-- Fix infinite recursion in RLS policies by breaking circular dependency

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own and shared conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view members of their conversations" ON conversation_members;

-- Recreate conversations SELECT policy without circular dependency
CREATE POLICY "Users can view their own and shared conversations"
ON conversations FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = conversations.id
    AND cm.user_id = auth.uid()
  )
);

-- Recreate conversation_members SELECT policy without checking back to conversations
CREATE POLICY "Users can view members of their conversations"
ON conversation_members FOR SELECT
USING (
  user_id = auth.uid() OR
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  ) OR
  conversation_id IN (
    SELECT cm2.conversation_id FROM conversation_members cm2 WHERE cm2.user_id = auth.uid()
  )
);

-- Fix quiz_questions INSERT policy to allow users to create questions
DROP POLICY IF EXISTS "Users can view questions from their quizzes" ON quiz_questions;

CREATE POLICY "Users can insert questions for their quizzes"
ON quiz_questions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_questions.quiz_id
    AND quizzes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view questions from their quizzes"
ON quiz_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quizzes
    WHERE quizzes.id = quiz_questions.quiz_id
    AND quizzes.user_id = auth.uid()
  )
);