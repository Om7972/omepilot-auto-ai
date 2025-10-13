import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { content, title, numQuestions = 5 } = await req.json();

    // Generate quiz using Lovable AI
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

    // Create quiz in database
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

    // Insert questions
    const questionsToInsert = questions.map((q: any, index: number) => ({
      quiz_id: quiz.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      order_index: index
    }));

    const { error: questionsError } = await supabaseClient
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    return new Response(
      JSON.stringify({ success: true, quiz, questions }),
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