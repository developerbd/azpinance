-- Create notification_settings table
create table if not exists notification_settings (
  user_id uuid references auth.users(id) primary key,
  email_enabled boolean default false,
  whatsapp_enabled boolean default false,
  discord_enabled boolean default false,
  discord_webhook_url text,
  whatsapp_number text,
  email_address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table notification_settings enable row level security;

-- Policies
create policy "Users can view their own settings"
  on notification_settings for select
  using ( auth.uid() = user_id );

create policy "Users can update their own settings"
  on notification_settings for update
  using ( auth.uid() = user_id );

create policy "Users can insert their own settings"
  on notification_settings for insert
  with check ( auth.uid() = user_id );

-- Admin policy (admins can view all)
create policy "Admins can view all settings"
  on notification_settings for select
  using ( 
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );
