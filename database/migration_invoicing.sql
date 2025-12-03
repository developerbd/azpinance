-- Create invoices table
create table if not exists invoices (
  id uuid default uuid_generate_v4() primary key,
  invoice_number text not null unique,
  contact_id uuid references contacts(id) on delete set null,
  type text not null check (type in ('invoice', 'bill')),
  status text not null check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')) default 'draft',
  issue_date date not null default current_date,
  due_date date not null,
  currency text not null default 'USD',
  subtotal numeric(15, 2) not null default 0,
  tax_rate numeric(5, 2) default 0,
  tax_amount numeric(15, 2) default 0,
  total_amount numeric(15, 2) not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create invoice_items table
create table if not exists invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references invoices(id) on delete cascade,
  description text not null,
  quantity numeric(15, 2) not null default 1,
  unit_price numeric(15, 2) not null default 0,
  amount numeric(15, 2) not null default 0
);

-- Enable RLS
alter table invoices enable row level security;
alter table invoice_items enable row level security;

-- Policies for Invoices
create policy "Authenticated users can view invoices"
  on invoices for select
  using ( auth.role() = 'authenticated' );

create policy "Staff can insert invoices"
  on invoices for insert
  with check ( 
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role in ('admin', 'supervisor', 'accountant')
    )
  );

create policy "Staff can update invoices"
  on invoices for update
  using ( 
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role in ('admin', 'supervisor', 'accountant')
    )
  );

create policy "Admins can delete invoices"
  on invoices for delete
  using ( 
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Policies for Invoice Items (Inherit from Invoice access mostly, but explicit here)
create policy "Authenticated users can view invoice items"
  on invoice_items for select
  using ( auth.role() = 'authenticated' );

create policy "Staff can insert invoice items"
  on invoice_items for insert
  with check ( 
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role in ('admin', 'supervisor', 'accountant')
    )
  );

create policy "Staff can update invoice items"
  on invoice_items for update
  using ( 
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role in ('admin', 'supervisor', 'accountant')
    )
  );

create policy "Staff can delete invoice items"
  on invoice_items for delete
  using ( 
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role in ('admin', 'supervisor', 'accountant')
    )
  );
