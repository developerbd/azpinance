-- Add portal_token and is_portal_active to contacts table
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS portal_token UUID DEFAULT NULL UNIQUE,
ADD COLUMN IF NOT EXISTS is_portal_active BOOLEAN DEFAULT FALSE;

-- Create index for faster lookup by token
CREATE INDEX IF NOT EXISTS idx_contacts_portal_token ON public.contacts(portal_token);

-- Update RLS policies?
-- The public view will likely use a "service role" or a specific function/RPC with security definer 
-- to bypass RLS for the anonymous user carrying the token, OR we can allow public select on these columns 
-- if we are careful. 
-- For now, we will handle the "public" access via a Server Action that uses the Service Role (or 'security definer' function) 
-- to validate the token and fetch data, rather than opening RLS to "anon".
