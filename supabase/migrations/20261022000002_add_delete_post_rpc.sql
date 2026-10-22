create or replace function public.delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to delete a post.';
  end if;

  delete from public.posts
  where id = p_post_id
    and profile_id = auth.uid();

  get diagnostics deleted_count = row_count;
  if deleted_count = 0 then
    raise exception 'Post was not found or does not belong to the signed-in user.';
  end if;
end;
$$;

grant execute on function public.delete_post(uuid) to authenticated;
