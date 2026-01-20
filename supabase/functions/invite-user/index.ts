import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting (per user)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 invite attempts per minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  userLimit.count++;
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
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Authenticate user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting check
    if (!checkRateLimit(user.id)) {
      console.log(`Rate limit exceeded for user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Too many invite attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { username, conversation_id } = await req.json();

    // Input validation
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid username provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!conversation_id || typeof conversation_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid conversation ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Verify user owns the conversation or is a member with invite rights
    const { data: conversation, error: convError } = await supabaseClient
      .from('conversations')
      .select('user_id, is_collaborative')
      .eq('id', conversation_id)
      .single();

    if (convError || !conversation) {
      console.log('Conversation not found or access denied');
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only conversation owner can invite
    if (conversation.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only the conversation owner can invite members' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!conversation.is_collaborative) {
      return new Response(
        JSON.stringify({ error: 'Collaboration is not enabled for this conversation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to lookup user (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the user by username (case-insensitive)
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .ilike('username', trimmedUsername)
      .limit(1);

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      // Return generic error to prevent enumeration
      return new Response(
        JSON.stringify({ error: 'Unable to process invite request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CRITICAL: Return the SAME generic message whether user exists or not
    // This prevents username enumeration
    if (!profiles || profiles.length === 0) {
      console.log(`Invite attempted for non-existent user: ${trimmedUsername}`);
      // Simulate some processing time to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'If a user with that username exists, they will be invited to the conversation.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetUser = profiles[0];

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', targetUser.id)
      .single();

    if (existingMember) {
      // Still return generic success message
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'If a user with that username exists, they will be invited to the conversation.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get existing member colors
    const { data: existingMembers } = await supabaseAdmin
      .from('conversation_members')
      .select('color')
      .eq('conversation_id', conversation_id);

    const usedColors = (existingMembers || []).map(m => m.color);
    const AVAILABLE_COLORS = [
      "#EF4444", "#F59E0B", "#10B981", "#3B82F6", 
      "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"
    ];
    const availableColor = AVAILABLE_COLORS.find(c => !usedColors.includes(c)) || AVAILABLE_COLORS[0];

    // Add user as member
    const { error: insertError } = await supabaseAdmin
      .from('conversation_members')
      .insert({
        conversation_id,
        user_id: targetUser.id,
        color: availableColor,
        role: 'member'
      });

    if (insertError) {
      console.error('Error adding member:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to add member' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification to invited user
    await supabaseAdmin.rpc('send_notification', {
      _user_id: targetUser.id,
      _type: 'collaboration_invite',
      _title: 'Collaboration Invite',
      _message: 'You have been invited to collaborate on a conversation.',
      _data: { conversation_id }
    });

    console.log(`Successfully invited user ${targetUser.id} to conversation ${conversation_id}`);

    // Return same generic message
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'If a user with that username exists, they will be invited to the conversation.',
        invited: true // Only used internally, not exposed to client
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in invite-user function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
