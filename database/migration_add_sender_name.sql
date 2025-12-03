-- Add sender_name column to smtp_settings
alter table smtp_settings 
add column if not exists sender_name text default 'Biz Ad Finance';
