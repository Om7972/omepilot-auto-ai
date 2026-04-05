import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
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

    const { query } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const today = new Date().toISOString().split('T')[0];
    
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
            content: `You are an expert research assistant. Today's date is ${today}. Provide comprehensive, well-structured answers using markdown formatting.

## Response Format Rules:
1. **Use proper markdown**: headings (##, ###), bold, italic, bullet points, numbered lists, code blocks, and tables where appropriate.
2. **Structure your answer** with clear sections using headings.
3. **Cite sources inline** using numbered references like [1], [2], etc.
4. **At the very end**, include a "## Sources" section listing each numbered reference with its title and URL in this exact format:
   - [1] Title of Source | https://example.com/url
   - [2] Another Source | https://another.com/url
5. **Use real, plausible URLs** based on authoritative sources (Wikipedia, official sites, major news outlets, government sites, research institutions).
6. **Be comprehensive** but concise. Use bullet points and tables for data-heavy content.
7. **Always prioritize** the most recent and accurate information available as of ${today}.
8. **Include specific facts**, numbers, dates, and data points to support your answer.

After your sources section, add:
## Images
List 3-6 relevant images with descriptive titles and real image URLs from Wikimedia Commons, official sites, or known public image sources. Format:
- [img] Descriptive Title | https://upload.wikimedia.org/... | https://source-page-url

## Follow-Up Questions
List exactly 3 concise follow-up questions the user might want to explore next, each on its own line starting with "- ".`
          },
          {
            role: 'user',
            content: `Research the following topic thoroughly and provide a well-cited answer with relevant images: ${query}`
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error('AI gateway error');
    }

    const aiData = await response.json();
    const answer = aiData.choices[0].message.content;

    // Parse sources
    const sources: { id: number; title: string; url: string }[] = [];
    const sourceSectionMatch = answer.match(/##\s*Sources?\s*\n([\s\S]*?)(?=##|$)/i);
    if (sourceSectionMatch) {
      for (const line of sourceSectionMatch[1].split('\n')) {
        const match = line.match(/\[(\d+)\]\s*(.+?)\s*\|\s*(https?:\/\/\S+)/);
        if (match) sources.push({ id: parseInt(match[1]), title: match[2].trim(), url: match[3].trim() });
      }
    }

    // Parse images
    const images: { title: string; url: string; sourceUrl: string }[] = [];
    const imgMatch = answer.match(/##\s*Images?\s*\n([\s\S]*?)(?=##|$)/i);
    if (imgMatch) {
      for (const line of imgMatch[1].split('\n')) {
        const m = line.match(/\[img\]\s*(.+?)\s*\|\s*(https?:\/\/\S+)\s*\|\s*(https?:\/\/\S+)/);
        if (m) images.push({ title: m[1].trim(), url: m[2].trim(), sourceUrl: m[3].trim() });
      }
    }

    // Parse follow-up questions
    const followUps: string[] = [];
    const followUpMatch = answer.match(/##\s*Follow[- ]?Up\s*Questions?\s*\n([\s\S]*?)(?=##|$)/i);
    if (followUpMatch) {
      for (const line of followUpMatch[1].split('\n')) {
        const q = line.replace(/^[-*]\s*/, '').trim();
        if (q && q.length > 5) followUps.push(q);
      }
    }

    // Clean answer
    const cleanAnswer = answer
      .replace(/##\s*Follow[- ]?Up\s*Questions?\s*\n[\s\S]*?$/i, '')
      .replace(/##\s*Images?\s*\n[\s\S]*?(?=##|$)/i, '')
      .replace(/##\s*Sources?\s*\n[\s\S]*?(?=##|$)/i, '')
      .trim();

    return new Response(
      JSON.stringify({ success: true, answer: cleanAnswer, sources, images, query, followUps: followUps.slice(0, 3) }),
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
