-- Add new columns to financial_accounts table
ALTER TABLE public.financial_accounts
ADD COLUMN IF NOT EXISTS scope text CHECK (scope IN ('local', 'international')) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}';

-- Update type check constraint to include new types
ALTER TABLE public.financial_accounts DROP CONSTRAINT IF EXISTS financial_accounts_type_check;
ALTER TABLE public.financial_accounts ADD CONSTRAINT financial_accounts_type_check 
CHECK (type IN ('bank', 'mobile_finance', 'cash', 'paypal', 'payoneer', 'wise', 'other'));
