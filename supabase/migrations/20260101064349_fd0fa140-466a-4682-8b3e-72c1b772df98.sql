-- Fix profiles SELECT policy to only allow viewing own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Add document UPDATE policy
CREATE POLICY "Users can update their own documents" 
ON public.documents FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add quiz UPDATE and DELETE policies
CREATE POLICY "Users can update their own quizzes" 
ON public.quizzes FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quizzes" 
ON public.quizzes FOR DELETE 
USING (auth.uid() = user_id);

-- Add quiz_questions UPDATE and DELETE policies
CREATE POLICY "Users can update questions in their quizzes" 
ON public.quiz_questions FOR UPDATE 
USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.user_id = auth.uid()));

CREATE POLICY "Users can delete questions from their quizzes" 
ON public.quiz_questions FOR DELETE 
USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = quiz_questions.quiz_id AND quizzes.user_id = auth.uid()));

-- Add quiz_answers UPDATE and DELETE policies
CREATE POLICY "Quiz owners can update answers" 
ON public.quiz_answers FOR UPDATE 
USING (EXISTS (SELECT 1 FROM quiz_questions qq JOIN quizzes q ON q.id = qq.quiz_id WHERE qq.id = quiz_answers.question_id AND q.user_id = auth.uid()));

CREATE POLICY "Quiz owners can delete answers" 
ON public.quiz_answers FOR DELETE 
USING (EXISTS (SELECT 1 FROM quiz_questions qq JOIN quizzes q ON q.id = qq.quiz_id WHERE qq.id = quiz_answers.question_id AND q.user_id = auth.uid()));

-- Add conversation_members UPDATE policy (only owners can update)
CREATE POLICY "Conversation owners can update members" 
ON public.conversation_members FOR UPDATE 
USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_members.conversation_id AND conversations.user_id = auth.uid()));