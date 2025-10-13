-- Create personas table for AI persona switching
CREATE TABLE public.personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  icon TEXT,
  model TEXT DEFAULT 'gemini',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_memories table for AI memory management
CREATE TABLE public.user_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table for file uploads
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL
);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plugins table
CREATE TABLE public.plugins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;

-- Personas policies (public read, admin write)
CREATE POLICY "Anyone can view personas"
  ON public.personas FOR SELECT
  USING (true);

-- User memories policies
CREATE POLICY "Users can view their own memories"
  ON public.user_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories"
  ON public.user_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON public.user_memories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON public.user_memories FOR DELETE
  USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- Quizzes policies
CREATE POLICY "Users can view their own quizzes"
  ON public.quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Quiz questions policies
CREATE POLICY "Users can view questions from their quizzes"
  ON public.quiz_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = quiz_questions.quiz_id
    AND quizzes.user_id = auth.uid()
  ));

-- Quiz attempts policies
CREATE POLICY "Users can view their own attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Plugins policies
CREATE POLICY "Users can view public plugins and their own"
  ON public.plugins FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create plugins"
  ON public.plugins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plugins"
  ON public.plugins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plugins"
  ON public.plugins FOR DELETE
  USING (auth.uid() = user_id);

-- Insert default personas
INSERT INTO public.personas (name, description, system_prompt, icon, model) VALUES
('Tutor', 'Patient teacher who explains concepts clearly', 'You are a patient and encouraging tutor. Break down complex topics into simple steps. Use analogies and examples. Always check for understanding before moving forward.', '🎓', 'gemini'),
('Coder', 'Expert programmer who writes clean code', 'You are an expert programmer. Write clean, efficient code with best practices. Explain your reasoning and suggest optimizations. Focus on readability and maintainability.', '💻', 'gemini'),
('Therapist', 'Empathetic listener and advisor', 'You are a compassionate and empathetic listener. Provide emotional support and thoughtful advice. Ask reflective questions and validate feelings.', '💭', 'gemini'),
('Analyst', 'Critical thinker who analyzes deeply', 'You are an analytical thinker. Break down problems methodically. Consider multiple perspectives. Provide evidence-based insights and identify patterns.', '🔍', 'anthropic'),
('Creative', 'Imaginative idea generator', 'You are a creative innovator. Think outside the box. Generate unique ideas and explore unconventional solutions. Embrace experimentation.', '🎨', 'gemini');

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );