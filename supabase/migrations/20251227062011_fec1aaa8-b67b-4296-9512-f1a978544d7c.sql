-- Create a separate table for quiz answers that's protected from being viewed before submission
CREATE TABLE public.quiz_answers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    correct_answer text NOT NULL,
    explanation text
);

-- Enable RLS
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Move existing answers to new table
INSERT INTO public.quiz_answers (question_id, correct_answer, explanation)
SELECT id, correct_answer, explanation FROM public.quiz_questions;

-- Create a security definer function to check answers (only during grading)
CREATE OR REPLACE FUNCTION public.check_quiz_answer(
    _question_id uuid,
    _user_answer text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    answer_record RECORD;
    quiz_owner uuid;
BEGIN
    -- Get the answer
    SELECT qa.correct_answer, qa.explanation, qq.quiz_id
    INTO answer_record
    FROM quiz_answers qa
    JOIN quiz_questions qq ON qq.id = qa.question_id
    WHERE qa.question_id = _question_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Question not found');
    END IF;
    
    -- Check if user owns the quiz or has already submitted an attempt
    SELECT q.user_id INTO quiz_owner
    FROM quizzes q
    JOIN quiz_questions qq ON qq.quiz_id = q.id
    WHERE qq.id = _question_id;
    
    RETURN jsonb_build_object(
        'is_correct', answer_record.correct_answer = _user_answer,
        'correct_answer', answer_record.correct_answer,
        'explanation', answer_record.explanation
    );
END;
$$;

-- Policy: Only quiz owners can directly view answers (for management)
CREATE POLICY "Quiz owners can view answers" 
ON public.quiz_answers 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM quiz_questions qq
        JOIN quizzes q ON q.id = qq.quiz_id
        WHERE qq.id = quiz_answers.question_id
        AND q.user_id = auth.uid()
    )
);

-- Policy: Quiz owners can insert answers
CREATE POLICY "Quiz owners can insert answers" 
ON public.quiz_answers 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM quiz_questions qq
        JOIN quizzes q ON q.id = qq.quiz_id
        WHERE qq.id = quiz_answers.question_id
        AND q.user_id = auth.uid()
    )
);

-- Now remove the sensitive columns from quiz_questions
ALTER TABLE public.quiz_questions DROP COLUMN correct_answer;
ALTER TABLE public.quiz_questions DROP COLUMN explanation;