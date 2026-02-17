-- Add missing columns for financial account details
ALTER TABLE public.financial_accounts
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS branch text;

-- Optional: Add comments/descriptions
COMMENT ON COLUMN public.financial_accounts.account_number IS 'Bank account number or wallet ID';
COMMENT ON COLUMN public.financial_accounts.bank_name IS 'Name of the bank or financial institution';
COMMENT ON COLUMN public.financial_accounts.branch IS 'Branch name or code';
