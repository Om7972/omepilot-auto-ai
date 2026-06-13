
-- Admin policies for visibility
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all user_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all conversations" ON public.conversations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all messages" ON public.messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all user_stats" ON public.user_stats
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin stats RPC
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_conversations', (SELECT COUNT(*) FROM public.conversations),
    'total_messages', (SELECT COUNT(*) FROM public.messages),
    'total_admins', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin'),
    'messages_last_7d', (SELECT COUNT(*) FROM public.messages WHERE created_at > now() - interval '7 days'),
    'new_users_last_7d', (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'active_users_today', (SELECT COUNT(*) FROM public.user_stats WHERE last_activity_date = CURRENT_DATE)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
