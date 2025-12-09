-- Fix Financial Account Schema
-- 1. Add missing columns if they don't exist
ALTER TABLE public.financial_accounts
ADD COLUMN IF NOT EXISTS scope text CHECK (scope IN ('local', 'international')) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('internal', 'receiving', 'third_party')) DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS attachments text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;

-- 2. Update type check constraint to include new types (payoneer, crypto, etc.)
ALTER TABLE public.financial_accounts DROP CONSTRAINT IF EXISTS financial_accounts_type_check;

ALTER TABLE public.financial_accounts ADD CONSTRAINT financial_accounts_type_check 
CHECK (type IN ('bank', 'mobile_finance', 'cash', 'paypal', 'payoneer', 'wise', 'crypto', 'wallet', 'credit_card', 'other'));

-- 3. Update currency check to allow longer codes (e.g. USDT)
-- Note: schema.sql defined currency as text without length constraint, but validation enforced 3 chars.
-- If there is a db constraint on currency length, drop it.
ALTER TABLE public.financial_accounts DROP CONSTRAINT IF EXISTS financial_accounts_currency_check;
-- (Optional) Add a loose check if desired, or leave it to app validation.
-- ALTER TABLE public.financial_accounts ADD CONSTRAINT financial_accounts_currency_check CHECK (length(currency) >= 3);
