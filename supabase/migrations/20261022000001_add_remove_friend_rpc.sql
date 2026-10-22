create or replace function public.remove_friend(p_friend_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to remove a friend.';
  end if;

  delete from public.friendships
  where status = 'accepted'
    and (
      (user_id = auth.uid() and friend_id = p_friend_id)
      or (user_id = p_friend_id and friend_id = auth.uid())
    );
end;
$$;

grant execute on function public.remove_friend(uuid) to authenticated;
