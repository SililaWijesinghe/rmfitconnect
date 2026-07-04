
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

revoke execute on function public.book_slot(date, time) from public, anon;
grant execute on function public.book_slot(date, time) to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
