revoke execute on function public.bootstrap_organization(text,text,text) from public, anon;
revoke execute on function public.join_organization(text,text,text,text) from public, anon;
grant execute on function public.bootstrap_organization(text,text,text) to authenticated;
grant execute on function public.join_organization(text,text,text,text) to authenticated;