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

    const { documentId } = await req.json();

    // Get document from database
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError) throw docError;

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('documents')
      .download(document.storage_path);

    if (downloadError) throw downloadError;

    // Convert to text based on file type
    let extractedText = '';
    
    if (document.file_type.includes('text') || document.file_type.includes('json')) {
      extractedText = await fileData.text();
    } else if (document.file_type.includes('pdf')) {
      // For PDFs, use Lovable AI to extract text
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text content from this document. Return only the extracted text without any commentary.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${document.file_type};base64,${base64}`
                  }
                }
              ]
            }
          ]
        }),
      });

      const aiData = await response.json();
      extractedText = aiData.choices[0].message.content;
    }

    // Update document with extracted text
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({ extracted_text: extractedText })
      .eq('id', documentId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, extractedText }),
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