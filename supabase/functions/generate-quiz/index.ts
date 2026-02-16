import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) { rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }); return true; }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests. Please wait a moment and try again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { content, title, numQuestions = 5 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a quiz generator. Create engaging multiple-choice questions based on the provided content. Return a JSON array of questions with the format: [{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": "A", "explanation": "..."}]'
          },
          {
            role: 'user',
            content: `Generate ${numQuestions} multiple-choice quiz questions based on this content:\n\n${content}`
          }
        ]
      }),
    });

    const aiData = await response.json();
    let questions;
    
    try {
      const content = aiData.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      questions = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      throw new Error('Failed to parse quiz questions');
    }

    const { data: quiz, error: quizError } = await supabaseClient
      .from('quizzes')
      .insert({
        user_id: user.id,
        title: title || 'Generated Quiz',
        description: `Quiz with ${numQuestions} questions`
      })
      .select()
      .single();

    if (quizError) throw quizError;

    const questionsToInsert = questions.map((q: any, index: number) => ({
      quiz_id: quiz.id,
      question: q.question,
      options: q.options,
      order_index: index
    }));

    const { data: insertedQuestions, error: questionsError } = await supabaseClient
      .from('quiz_questions')
      .insert(questionsToInsert)
      .select();

    if (questionsError) throw questionsError;

    const answersToInsert = insertedQuestions.map((insertedQ: any, index: number) => ({
      question_id: insertedQ.id,
      correct_answer: questions[index].correct_answer,
      explanation: questions[index].explanation
    }));

    const { error: answersError } = await supabaseClient
      .from('quiz_answers')
      .insert(answersToInsert);

    if (answersError) throw answersError;

    const questionsWithIds = insertedQuestions.map((q: any, index: number) => ({
      ...q,
      options: questions[index].options
    }));

    return new Response(
      JSON.stringify({ success: true, quiz, questions: questionsWithIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
