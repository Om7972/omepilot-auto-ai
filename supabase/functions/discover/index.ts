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
    // Auth check
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }
    
    console.log(`Discover request from user: ${user.id}`);

    const { category } = await req.json();
    
    console.log('Discover request for category:', category);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const today = new Date().toISOString().split('T')[0];
    
    const prompts: Record<string, string> = {
      news: `Today is ${today}. Provide 5 of the most important and interesting news stories happening right now in the world. Include the latest breaking news, global events, politics, technology, and science. Format each with a bold title and a 2-3 sentence description. Be specific with dates, names, and facts.`,
      history: `Today is ${today}. Share 5 fascinating historical events that happened on this exact date (${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}). Include the year, a detailed description of the event, and its lasting significance. Include a mix of well-known and lesser-known events.`,
      business: `Today is ${today}. Provide 5 key business insights, market movements, and economic trends happening right now. Include specific company names, stock movements, industry shifts, mergers, funding rounds, or policy changes. Be specific and data-driven.`,
      knowledge: `Today is ${today}. Share 5 fascinating and surprising "Did You Know" facts. Mix recent scientific discoveries, technological breakthroughs, and little-known facts about the world. Make them engaging, educational, and verifiable. Include at least 2 facts from recent months.`,
      trends: `Today is ${today}. Analyze 5 of the hottest current market and technology trends right now. Cover areas like AI, fintech, climate tech, social media, healthcare, or emerging markets. Include specific companies, products, or technologies driving each trend. Be current and forward-looking.`
    };

    const prompt = prompts[category] || prompts.knowledge;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: `You are a knowledgeable content curator with access to the latest information. Today's date is ${today}. Always provide the most current, accurate, and up-to-date information available. Include specific dates, numbers, and names when possible. Never say you don't have access to current information - provide the best and most recent knowledge you have.` },
          { role: 'user', content: prompt }
        ]
      })
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
      
      throw new Error('Failed to fetch discover content');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    console.log('Discover content generated successfully');

    return new Response(
      JSON.stringify({ success: true, content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Discover error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
