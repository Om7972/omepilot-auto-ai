import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, type } = await req.json();
    
    console.log('Generating document:', { title, type });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let prompt = '';
    switch (type) {
      case 'business-proposal':
        prompt = `Create a professional business proposal document with the title "${title}". ${description ? `Focus on: ${description}` : ''} Include executive summary, objectives, methodology, timeline, and budget sections.`;
        break;
      case 'report':
        prompt = `Generate a comprehensive report titled "${title}". ${description ? `Key points: ${description}` : ''} Include introduction, analysis, findings, and recommendations.`;
        break;
      case 'article':
        prompt = `Write an engaging article with the title "${title}". ${description ? `About: ${description}` : ''} Include introduction, main body with subheadings, and conclusion.`;
        break;
      case 'essay':
        prompt = `Write an academic essay titled "${title}". ${description ? `Topic: ${description}` : ''} Include thesis statement, supporting arguments, and conclusion.`;
        break;
      default:
        prompt = `Generate a well-structured document titled "${title}". ${description || ''}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a professional document writer. Create well-structured, comprehensive documents with clear formatting.' },
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
      
      throw new Error('Failed to generate document');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No document generated');
    }

    console.log('Document generated successfully');

    return new Response(
      JSON.stringify({ success: true, content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Document generation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
