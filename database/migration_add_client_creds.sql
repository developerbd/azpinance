-- Add Client ID and Secret columns to integration_tokens table
ALTER TABLE public.integration_tokens 
ADD COLUMN IF NOT EXISTS client_id TEXT,
ADD COLUMN IF NOT EXISTS client_secret TEXT;
