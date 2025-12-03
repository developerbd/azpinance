-- Add status column to financial_accounts table
ALTER TABLE public.financial_accounts
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active', 'inactive')) DEFAULT 'active';
