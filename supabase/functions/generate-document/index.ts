import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('Gemini_API_Key');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, type } = await req.json();
    
    console.log('Generating document:', { title, type });

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        })
      }
    );

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;

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