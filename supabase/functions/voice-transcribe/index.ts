import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Debug: log incoming request headers (avoid logging sensitive tokens in production)
    try {
      const headersObj: Record<string, string> = {};
      for (const [k, v] of req.headers) headersObj[k] = v;
      console.info("voice-transcribe request headers:", headersObj);
    } catch (hErr) {
      console.warn("Failed to log request headers", hErr);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: authError
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized. Please log in again." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to parse FormData - be flexible with content-type
    let form: FormData;
    let audio: File | null = null;

    try {
      form = await req.formData();
      audio = form.get("audio") as File | null;
      // Log file metadata for debugging
      if (audio) {
        try {
          console.info("voice-transcribe received file:", {
            name: audio.name,
            type: audio.type,
            size: audio.size,
          });
        } catch (mErr) {
          console.warn("Could not read audio metadata", mErr);
        }
      }
    } catch (formError) {
      console.error("FormData parsing error:", formError);
      // Try alternative parsing if FormData fails
      const contentType = req.headers.get("content-type") || "";
      if (!contentType.includes("multipart") && !contentType.includes("form-data")) {
        return new Response(
          JSON.stringify({ error: "Invalid request format. Expected multipart/form-data." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      // If we get here, try to read the body differently
      throw new Error("Could not parse FormData");
    }

    if (!audio || !(audio instanceof File)) {
      console.error("Audio file not found in request");
      return new Response(JSON.stringify({ error: "No audio file provided in request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate audio file size (max 25MB for Whisper)
    if (audio.size > 25 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Audio file too large. Maximum size is 25MB." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: "OPENAI_API_KEY is not configured. Please add it to Supabase project secrets (Settings → Vault). Voice transcription requires OpenAI Whisper API."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    try {
      const apiForm = new FormData();
      apiForm.append("file", audio, audio.name || "audio.webm");
      apiForm.append("model", "whisper-1");

      let response;
      try {
        response = await fetch(
          "https://api.openai.com/v1/audio/transcriptions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: apiForm,
          }
        );
      } catch (fetchErr: any) {
        console.error("OpenAI fetch error:", fetchErr);
        return new Response(
          JSON.stringify({ error: "Transcription service fetch error", details: fetchErr?.message }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI transcription error:", response.status, errorText);

        let errorMessage = "Transcription failed";
        if (response.status === 401) {
          errorMessage = "Invalid OpenAI API key. Please check your OPENAI_API_KEY in Supabase secrets.";
        } else if (response.status === 429) {
          errorMessage = "OpenAI rate limit exceeded. Please try again in a moment.";
        } else if (response.status === 402) {
          errorMessage = "OpenAI payment required. Please add credits to your OpenAI account.";
        }

        // Include original OpenAI error body for debugging (may contain helpful details)
        let details = null;
        try { details = JSON.parse(errorText); } catch { details = errorText; }

        return new Response(
          JSON.stringify({ error: errorMessage, details }),
          {
            status: response.status >= 500 ? 500 : response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await response.json();
      const transcribedText = result.text ?? "";

      if (!transcribedText.trim()) {
        return new Response(
          JSON.stringify({ error: "No speech detected in the audio. Please try speaking again." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ text: transcribedText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Voice transcription error:", error);
      return new Response(
        JSON.stringify({ 
          error: error?.message || "Transcription service error. Please try again."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("voice-transcribe error:", error);
    const errorMessage = error?.message || "Unknown error occurred";
    const errorDetails = error?.stack || "";
    
    // Log full error for debugging
    console.error("Full error details:", {
      message: errorMessage,
      stack: errorDetails,
      name: error?.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage.includes("FormData") || errorMessage.includes("parse")
          ? "Failed to process audio file. Please try recording again."
          : errorMessage || "Voice transcription service error. Please try again."
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
