-- Add missing columns to forex_transactions
DO $$
BEGIN
    -- Add receiving_account_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forex_transactions' AND column_name = 'receiving_account_id') THEN
        ALTER TABLE public.forex_transactions 
        ADD COLUMN receiving_account_id UUID REFERENCES public.financial_accounts(id);
    END IF;

    -- Add user_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forex_transactions' AND column_name = 'user_id') THEN
        ALTER TABLE public.forex_transactions 
        ADD COLUMN user_id UUID REFERENCES public.users(id);
    END IF;
END $$;
