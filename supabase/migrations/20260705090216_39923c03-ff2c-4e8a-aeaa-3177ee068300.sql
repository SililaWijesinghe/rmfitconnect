
-- Fix 1: Restrict avatars SELECT to owner (folder = auth.uid())
DROP POLICY IF EXISTS avatars_select ON storage.objects;
CREATE POLICY avatars_select ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Fix 2: Lock down SECURITY DEFINER function execution.
-- book_slot must remain callable by authenticated users (used by booking flow).
-- has_role is used inside RLS policies; authenticated needs EXECUTE for policies to evaluate.
-- Revoke from PUBLIC/anon to remove implicit access.
REVOKE ALL ON FUNCTION public.book_slot(date, time) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.book_slot(date, time) TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
