-- 1. Add username column to public.users
alter table public.users add column if not exists username text unique;

-- 2. Function to get email by username (Security Definer to bypass RLS)
-- This allows the login page to look up the email associated with a username
create or replace function public.get_email_by_username(p_username text)
returns text
language plpgsql
security definer
as $$
begin
  return (select email from public.users where username = p_username);
end;
$$;

-- 3. Update trigger to save username from metadata
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role, username)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'guest',
    new.raw_user_meta_data->>'username'
  );
  return new;
end;
$$ language plpgsql security definer;
