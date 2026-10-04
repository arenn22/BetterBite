create policy "Authenticated users can read cooked post photos"
on storage.objects
for select
to authenticated
using (bucket_id = 'cooked_posts-images');