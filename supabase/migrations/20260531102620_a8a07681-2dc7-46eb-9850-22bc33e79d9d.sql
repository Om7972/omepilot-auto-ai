
-- 1) Prevent privilege escalation on user_roles: explicit restrictive INSERT policy
-- Only allow inserts when the caller is an admin; deny everyone else.
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Realtime channel authorization: only allow subscriptions to topics for
-- conversations the user is a member of (or any conversation they own).
-- Topic convention used by the app is the conversation UUID.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read own conversation channels" ON realtime.messages;
CREATE POLICY "Authenticated can read own conversation channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow postgres_changes system topics (they are filtered by table RLS)
  (realtime.topic() IS NULL)
  OR public.is_conversation_member(realtime.topic()::uuid, auth.uid())
  OR public.is_conversation_owner(realtime.topic()::uuid, auth.uid())
);

DROP POLICY IF EXISTS "Authenticated can broadcast to own conversation channels" ON realtime.messages;
CREATE POLICY "Authenticated can broadcast to own conversation channels"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_conversation_member(realtime.topic()::uuid, auth.uid())
  OR public.is_conversation_owner(realtime.topic()::uuid, auth.uid())
);
