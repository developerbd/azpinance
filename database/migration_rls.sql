-- Allow users to read their own profile
create policy "Users can read own profile" on public.users
  for select using (auth.uid() = id);

-- Allow users to update their own profile (optional, but good for settings)
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
