-- 1. Update financial_accounts
ALTER TABLE public.financial_accounts
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('receiving', 'third_party', 'internal')) DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- 2. Update forex_transactions
ALTER TABLE public.forex_transactions
ADD COLUMN IF NOT EXISTS receiving_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL;

-- 3. Create supplier_payments table
CREATE TABLE IF NOT EXISTS public.supplier_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    destination_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL, -- The 3rd party account
    transaction_method TEXT, -- 'bank_transfer', 'cash', etc.
    reference_id TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Enable RLS for supplier_payments
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;

-- Policies for supplier_payments (Mirroring Forex policies roughly)

-- 1. VIEW: All authenticated users can view
CREATE POLICY "Supplier Payments View Policy" ON public.supplier_payments
FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. INSERT: Accountant, Supervisor, Admin
CREATE POLICY "Supplier Payments Insert Policy" ON public.supplier_payments
FOR INSERT
WITH CHECK (
    public.get_my_role() IN ('accountant', 'supervisor', 'admin')
);

-- 3. UPDATE: Supervisor, Admin
CREATE POLICY "Supplier Payments Update Policy" ON public.supplier_payments
FOR UPDATE
USING (
    public.get_my_role() IN ('supervisor', 'admin')
);

-- 4. DELETE: Supervisor, Admin
CREATE POLICY "Supplier Payments Delete Policy" ON public.supplier_payments
FOR DELETE
USING (
    public.get_my_role() IN ('supervisor', 'admin')
);
