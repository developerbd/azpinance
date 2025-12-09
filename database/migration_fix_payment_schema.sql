-- Fix Supplier Payment Schema
-- 1. Create table if it doesn't exist (with correct columns)
CREATE TABLE IF NOT EXISTS public.supplier_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_method TEXT, -- 'bank_transfer', 'cash', etc.
    reference_id TEXT,
    notes TEXT,
    destination_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    invoice_numbers TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL -- Sometimes auth.uid() is stored here
);

-- 2. Add columns if table exists but columns match old schema or are missing
ALTER TABLE public.supplier_payments
ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS transaction_method TEXT,
ADD COLUMN IF NOT EXISTS reference_id TEXT,
ADD COLUMN IF NOT EXISTS destination_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS invoice_numbers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (if they don't exist, this might error if they do, so we drop first to be safe or use IF NOT EXISTS workaround is complex in pure SQL without PL/pgSQL block. Dropping is safer for a "fix" script)
DROP POLICY IF EXISTS "Supplier Payments View Policy" ON public.supplier_payments;
CREATE POLICY "Supplier Payments View Policy" ON public.supplier_payments FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Supplier Payments Insert Policy" ON public.supplier_payments;
CREATE POLICY "Supplier Payments Insert Policy" ON public.supplier_payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Supplier Payments Update Policy" ON public.supplier_payments;
CREATE POLICY "Supplier Payments Update Policy" ON public.supplier_payments FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Supplier Payments Delete Policy" ON public.supplier_payments;
CREATE POLICY "Supplier Payments Delete Policy" ON public.supplier_payments FOR DELETE USING (auth.role() = 'authenticated');
