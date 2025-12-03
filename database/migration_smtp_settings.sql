-- Create smtp_settings table
create table if not exists smtp_settings (
  id int primary key default 1 check (id = 1), -- Singleton
  host text,
  port int default 587,
  "user" text, -- quoted because user is a reserved keyword
  password text,
  from_email text,
  updated_at timestamptz default now()
);

-- Initialize default row
insert into smtp_settings (id) values (1) on conflict do nothing;

-- Enable RLS
alter table smtp_settings enable row level security;

-- Policies
-- Only Admins can view/update SMTP settings (High Security)
create policy "Admins can view smtp settings"
  on smtp_settings for select
  using ( 
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

create policy "Admins can update smtp settings"
  on smtp_settings for update
  using ( 
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );
