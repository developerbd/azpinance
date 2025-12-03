-- Add transaction_date column to forex_transactions
ALTER TABLE public.forex_transactions 
ADD COLUMN transaction_date DATE DEFAULT CURRENT_DATE;

-- Update existing records to have transaction_date = created_at::date
UPDATE public.forex_transactions 
SET transaction_date = created_at::DATE;
