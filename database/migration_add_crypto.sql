-- Add 'crypto' to the allowed types for financial_accounts
ALTER TABLE public.financial_accounts DROP CONSTRAINT IF EXISTS financial_accounts_type_check;
ALTER TABLE public.financial_accounts ADD CONSTRAINT financial_accounts_type_check 
CHECK (type IN ('bank', 'mobile_finance', 'cash', 'paypal', 'payoneer', 'wise', 'crypto', 'other'));
