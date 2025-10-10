import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('Gemini_API_Key');
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  try {
    const { message, conversationId, provider = 'gemini' } = await req.json();
    
    console.log('Processing chat message:', { conversationId, provider });

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Save user message
    const { error: userMsgError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
      });

    if (userMsgError) throw userMsgError;

    // Get conversation history
    const { data: history } = await supabaseClient
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    let aiResponse = '';

    // Call appropriate AI provider
    if (provider === 'gemini' && GEMINI_API_KEY) {
      aiResponse = await callGemini(history || [], message);
    } else if (provider === 'anthropic' && ANTHROPIC_API_KEY) {
      aiResponse = await callAnthropic(history || [], message);
    } else if (provider === 'groq' && GROQ_API_KEY) {
      aiResponse = await callGroq(history || [], message);
    } else if (provider === 'openai' && OPENAI_API_KEY) {
      aiResponse = await callOpenAI(history || [], message);
    } else {
      aiResponse = await callGemini(history || [], message);
    }

    // Save AI response
    const { error: aiMsgError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
      });

    if (aiMsgError) throw aiMsgError;

    // Send to n8n webhook
    try {
      await fetch('https://omi7972.app.n8n.cloud/webhook/e5616171-e3b5-4c39-81d4-67409f9fa60a/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userMessage: message,
          aiResponse,
          history,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (webhookError) {
      console.error('Webhook error:', webhookError);
    }

    return new Response(
      JSON.stringify({ success: true, response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function callGemini(history: any[], message: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          ...history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          })),
          { role: 'user', parts: [{ text: message }] }
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        }
      })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callAnthropic(history: any[], message: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ]
    })
  });

  const data = await response.json();
  return data.content[0].text;
}

async function callGroq(history: any[], message: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ],
      temperature: 0.9,
      max_tokens: 2048,
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOpenAI(history: any[], message: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ],
      temperature: 0.9,
      max_tokens: 2048,
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
