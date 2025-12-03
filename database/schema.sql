-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. USERS (Extends Supabase Auth)
-- Note: Supabase handles auth.users. This table 'public.users' is a profile table.
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null check (role in ('admin', 'supervisor', 'accountant', 'guest')) default 'guest',
  status text not null check (status in ('active', 'suspended')) default 'active',
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 1.1 SYSTEM SETTINGS (Singleton Table)
create table public.system_settings (
  id int primary key default 1 check (id = 1), -- Ensure only one row exists
  company_name text default 'My Agency',
  company_logo_url text,
  company_address text,
  company_email text,
  timezone text default 'UTC',
  
  -- SEO & Integrations
  seo_title_template text default '%s | Agency CRM',
  seo_description_default text,
  gtm_id text, -- Google Tag Manager ID
  pixel_id text, -- Meta Pixel ID
  custom_header_scripts text,
  custom_footer_scripts text,
  
  -- Security
  security_allowed_ips text, -- Comma separated list of allowed IPs (CIDR or single)
  security_blocked_ips text, -- Comma separated list of blocked IPs
  
  updated_at timestamptz default now()
);

-- Initialize default settings
insert into public.system_settings (id) values (1) on conflict do nothing;

-- 2. CONTACTS (Clients & Vendors)
create table public.contacts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null check (type in ('client', 'supplier', 'other')),
  email text,
  phone text,
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. FINANCIAL ACCOUNTS
create table public.financial_accounts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null check (type in ('bank', 'wallet', 'credit_card', 'other')),
  currency text not null default 'USD',
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. TRANSACTIONS
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  description text not null,
  amount numeric(15, 2) not null, -- Positive for Income, Negative for Expense
  type text not null check (type in ('income', 'expense', 'transfer')),
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  date timestamptz not null default now(),
  
  -- Foreign Keys
  account_id uuid references public.financial_accounts(id) on delete restrict,
  contact_id uuid references public.contacts(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  
  -- Metadata
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. AUDIT LOGS
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- 6. REPORTING VIEWS

-- KPI: Current Balance per Account
create or replace view view_kpi_current_balance as
select 
  a.id as account_id,
  a.name as account_name,
  a.currency,
  coalesce(sum(t.amount), 0) as current_balance
from public.financial_accounts a
left join public.transactions t on a.id = t.account_id and t.status = 'approved'
group by a.id, a.name, a.currency;

-- KPI: Total Receivables (Assuming 'income' transactions that are 'pending' or specific logic)
-- For this MVP, let's assume 'income' transactions with status 'pending' are receivables.
create or replace view view_kpi_receivables as
select 
  coalesce(sum(amount), 0) as total_receivables
from public.transactions
where type = 'income' and status = 'pending';

-- KPI: Avg Dollar Buy Rate (Weighted Average)
-- Assuming we track currency exchanges. For simplicity, let's assume a 'transfer' or specific expense type tracks this.
-- Or if this is a multi-currency system, we'd need a more complex setup.
-- For now, creating a placeholder view that can be expanded.
create or replace view view_kpi_avg_buy_rate as
select 
  0.00 as avg_buy_rate; -- Placeholder logic to be refined based on specific forex requirements

-- Chart: Monthly Cashflow (Income vs Expense)
create or replace view view_monthly_cashflow as
select
  to_char(date, 'YYYY-MM') as month,
  sum(case when type = 'income' then amount else 0 end) as income,
  sum(case when type = 'expense' then abs(amount) else 0 end) as expense
from public.transactions
where status = 'approved'
group by 1
order by 1 desc
limit 12;

-- Chart: Expense Breakdown by Category (using description or a future category field)
-- For now, grouping by 'description' as a proxy, or we can add a 'category' column later.
-- Let's assume we might use a custom field 'category' or just group by description for now.
create or replace view view_expense_breakdown as
select
  description as category, -- Placeholder: ideally this would be a real category column
  sum(abs(amount)) as total_amount
from public.transactions
where type = 'expense' and status = 'approved'
group by 1
order by 2 desc
limit 5;

-- RLS POLICIES (Basic Setup)
alter table public.users enable row level security;
alter table public.contacts enable row level security;
alter table public.financial_accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.audit_logs enable row level security;

-- Example Policy: Admins can do everything
create policy "Admins have full access" on public.users
  for all using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Trigger to handle new user signup (Supabase Auth -> public.users)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'guest');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
