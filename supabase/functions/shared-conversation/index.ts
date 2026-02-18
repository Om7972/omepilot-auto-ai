import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversationId");
    const shareToken = url.searchParams.get("token");

    // Validate inputs
    if (!conversationId || !shareToken) {
      return new Response(
        JSON.stringify({ error: "Missing conversationId or token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversationId)) {
      return new Response(
        JSON.stringify({ error: "Invalid conversation ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (shareToken.length > 64 || !/^[a-f0-9]+$/i.test(shareToken)) {
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS for share token lookup
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify share token matches conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, title, created_at, share_token")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Constant-time comparison to prevent timing attacks
    const tokenBytes = new TextEncoder().encode(shareToken);
    const storedBytes = new TextEncoder().encode(conversation.share_token || "");

    if (tokenBytes.length !== storedBytes.length) {
      return new Response(
        JSON.stringify({ error: "Invalid share token" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let mismatch = 0;
    for (let i = 0; i < tokenBytes.length; i++) {
      mismatch |= tokenBytes[i] ^ storedBytes[i];
    }

    if (mismatch !== 0) {
      return new Response(
        JSON.stringify({ error: "Invalid share token" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch messages (read-only, no user_id exposed)
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("id, content, role, created_at, attachments, is_pinned")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(500);

    if (msgError) {
      console.error("Error fetching messages:", msgError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch messages" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        conversation: {
          id: conversation.id,
          title: conversation.title,
          created_at: conversation.created_at,
        },
        messages: messages || [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
