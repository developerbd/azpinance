-- 1. Add new columns to contacts table
alter table public.contacts
add column if not exists company_name text,
add column if not exists website text,
add column if not exists facebook text,
add column if not exists address text,
add column if not exists status text check (status in ('active', 'suspended', 'archived')) default 'active',
add column if not exists attachments jsonb default '[]'::jsonb;

-- 2. Create storage bucket for attachments
-- Note: This requires the 'storage' extension which is usually enabled by default in Supabase
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- 3. Storage RLS Policies

-- Allow authenticated users to view files in 'attachments'
create policy "Authenticated users can view attachments"
on storage.objects for select
using ( bucket_id = 'attachments' and auth.role() = 'authenticated' );

-- Allow authenticated users to upload files to 'attachments'
create policy "Authenticated users can upload attachments"
on storage.objects for insert
with check ( bucket_id = 'attachments' and auth.role() = 'authenticated' );

-- Allow admins to update/delete files
create policy "Admins can update/delete attachments"
on storage.objects for all
using ( bucket_id = 'attachments' and exists (select 1 from public.users where id = auth.uid() and role = 'admin') );
