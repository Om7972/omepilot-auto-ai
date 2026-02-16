import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limiting: max 10 image generations per minute per user
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
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

    // Rate limit check
    if (!checkRateLimit(user.id)) {
      console.warn(`Rate limit exceeded for user: ${user.id}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests. Please wait a moment and try again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Image generation request from user: ${user.id}`);

    const { prompt } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('Image generation service not configured');
    }
    
    console.log('Generating image with Lovable AI for prompt:', prompt);

    // Use Lovable AI gateway with Gemini image generation model
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: `Generate a high-quality, detailed image: ${prompt}. Make it visually stunning and creative.`
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      throw new Error(`Failed to generate image: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response received');

    // Extract the image from the response
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      console.error('No image data in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    console.log('Image generated successfully');

    return new Response(
      JSON.stringify({ success: true, image: imageData, imageUrl: imageData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate image' 
      }),
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
