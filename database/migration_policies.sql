-- Enable RLS on tables (already done, but safe to repeat)
alter table public.contacts enable row level security;
alter table public.financial_accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.audit_logs enable row level security;

-- CONTACTS POLICIES
create policy "Admins have full access to contacts" on public.contacts
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Users can view contacts" on public.contacts
  for select using (auth.role() = 'authenticated');

-- FINANCIAL ACCOUNTS POLICIES
create policy "Admins have full access to accounts" on public.financial_accounts
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Users can view accounts" on public.financial_accounts
  for select using (auth.role() = 'authenticated');

-- TRANSACTIONS POLICIES
create policy "Admins have full access to transactions" on public.transactions
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Users can view transactions" on public.transactions
  for select using (auth.role() = 'authenticated');

-- AUDIT LOGS POLICIES
create policy "Admins have full access to audit_logs" on public.audit_logs
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
