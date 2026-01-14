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
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized. Please log in again." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse FormData
    let form: FormData;
    let audio: File | null = null;

    try {
      form = await req.formData();
      audio = form.get("audio") as File | null;

      if (audio) {
        console.info("voice-transcribe received file:", {
          name: audio.name,
          type: audio.type,
          size: audio.size,
        });
      }
    } catch (formError) {
      console.error("FormData parsing error:", formError);
      return new Response(
        JSON.stringify({
          error: "Invalid request format. Expected multipart/form-data.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!audio || !(audio instanceof File)) {
      console.error("Audio file not found in request");
      return new Response(
        JSON.stringify({ error: "No audio file provided in request" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate audio file size (max 25MB)
    if (audio.size > 25 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Audio file too large. Maximum size is 25MB." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "GROQ_API_KEY is not configured. Please add it to backend secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    try {
      const apiForm = new FormData();
      apiForm.append("file", audio, audio.name || "audio.webm");
      apiForm.append("model", "whisper-large-v3");

      console.info("Calling Groq Whisper API...");

      const response = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: apiForm,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq transcription error:", response.status, errorText);

        let details: any = null;
        try {
          details = JSON.parse(errorText);
        } catch {
          details = errorText;
        }

        let errorMessage = "Transcription failed";

        if (response.status === 401) {
          errorMessage =
            "Invalid Groq API key. Please check your GROQ_API_KEY in backend secrets.";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again in a moment.";
        } else if (response.status === 413) {
          errorMessage = "Audio file too large for transcription.";
        }

        return new Response(JSON.stringify({ error: errorMessage, details }), {
          status: response.status >= 500 ? 500 : response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await response.json();
      const transcribedText = result.text ?? "";

      console.info("Transcription successful, length:", transcribedText.length);

      if (!transcribedText.trim()) {
        return new Response(
          JSON.stringify({
            error: "No speech detected in the audio. Please try speaking again.",
          }),
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
          error: error?.message || "Transcription service error. Please try again.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("voice-transcribe error:", error);
    return new Response(
      JSON.stringify({
        error:
          error?.message?.includes("FormData") || error?.message?.includes("parse")
            ? "Failed to process audio file. Please try recording again."
            : error?.message || "Voice transcription service error. Please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
