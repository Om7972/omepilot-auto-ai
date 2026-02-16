import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limiting: max 20 requests per minute per user
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

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
    // Check authorization header first
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, conversationId, provider = 'gemini' } = await req.json();
    
    console.log('Processing chat message:', { conversationId, provider });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized. Please log in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit check
    if (!checkRateLimit(user.id)) {
      console.warn(`Rate limit exceeded for user: ${user.id}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests. Please wait a moment and try again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save user message with user_id for collaborative tracking
    const { error: userMsgError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        user_id: user.id
      });

    if (userMsgError) throw userMsgError;

    // Get conversation history
    const { data: history } = await supabaseClient
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    // Use Lovable AI for all providers
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Map provider to model
    let model = 'google/gemini-2.5-flash';
    let systemPrompt = 'You are Omepilot, a helpful AI assistant. Be conversational, helpful, and concise.';
    
    if (provider === 'gpt-5' || provider === 'openai') {
      model = 'openai/gpt-5';
      systemPrompt = 'You are Omepilot, powered by GPT-5. Provide thoughtful, detailed responses with excellent reasoning.';
    } else if (provider === 'deep' || provider === 'anthropic') {
      model = 'google/gemini-2.5-pro';
      systemPrompt = 'You are Omepilot in deep thinking mode. Analyze thoroughly and provide comprehensive, well-reasoned responses.';
    } else if (provider === 'quick' || provider === 'groq') {
      model = 'google/gemini-2.5-flash-lite';
      systemPrompt = 'You are Omepilot in quick mode. Be fast, concise, and to the point.';
    } else if (provider === 'learn') {
      model = 'google/gemini-2.5-flash';
      systemPrompt = 'You are Omepilot in study mode. Help the user learn by breaking down concepts, asking guiding questions, and providing clear explanations.';
    } else if (provider === 'search') {
      model = 'google/gemini-2.5-flash';
      systemPrompt = 'You are Omepilot with search capabilities. Provide informative answers with relevant facts and details.';
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add funds to your account.');
      }
      
      throw new Error('AI service error');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
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

    console.log('Chat response generated successfully');

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
