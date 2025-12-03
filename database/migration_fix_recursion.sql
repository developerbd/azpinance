-- 1. Create a Security Definer function to check admin status
-- This function bypasses RLS, preventing the infinite loop when querying the users table
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$;

-- 2. Fix 'public.users' Policy (The Source of Recursion)
drop policy if exists "Admins have full access" on public.users;
create policy "Admins have full access" on public.users
  for all using (public.is_admin());

-- 3. Update other policies to use the safe function (Cleaner & Faster)

-- Contacts
drop policy if exists "Admins have full access to contacts" on public.contacts;
create policy "Admins have full access to contacts" on public.contacts
  for all using (public.is_admin());

-- Financial Accounts
drop policy if exists "Admins have full access to accounts" on public.financial_accounts;
create policy "Admins have full access to accounts" on public.financial_accounts
  for all using (public.is_admin());

-- Transactions
drop policy if exists "Admins have full access to transactions" on public.transactions;
create policy "Admins have full access to transactions" on public.transactions
  for all using (public.is_admin());

-- Audit Logs
drop policy if exists "Admins have full access to audit_logs" on public.audit_logs;
create policy "Admins have full access to audit_logs" on public.audit_logs
  for all using (public.is_admin());
