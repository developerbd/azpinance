-- Create Forex Transactions Table
CREATE TABLE IF NOT EXISTS public.forex_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contact_id UUID REFERENCES public.contacts(id),
    account_type TEXT NOT NULL, -- 'bank', 'mfs', 'crypto'
    currency TEXT DEFAULT 'USD',
    amount NUMERIC(15, 2) NOT NULL, -- Receiving Amount
    exchange_rate NUMERIC(10, 2) NOT NULL,
    amount_bdt NUMERIC(15, 2) NOT NULL,
    transaction_id TEXT,
    note TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
    payment_status TEXT DEFAULT 'processing' CHECK (payment_status IN ('processing', 'paid')),
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.forex_transactions ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. VIEW: All authenticated users can view
CREATE POLICY "Forex View Policy" ON public.forex_transactions
FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. INSERT: Accountant, Supervisor, Admin
CREATE POLICY "Forex Insert Policy" ON public.forex_transactions
FOR INSERT
WITH CHECK (
    public.get_my_role() IN ('accountant', 'supervisor', 'admin')
);

-- 3. UPDATE:
-- Accountant: Can update ONLY if status is 'pending' AND cannot change status/payment_status to approved/paid (handled in app logic, but RLS can enforce 'pending' check)
-- Supervisor/Admin: Can update anything.
CREATE POLICY "Forex Update Policy" ON public.forex_transactions
FOR UPDATE
USING (
    (public.get_my_role() IN ('supervisor', 'admin')) OR
    (public.get_my_role() = 'accountant' AND status = 'pending')
);

-- 4. DELETE: Supervisor, Admin only
CREATE POLICY "Forex Delete Policy" ON public.forex_transactions
FOR DELETE
USING (
    public.get_my_role() IN ('supervisor', 'admin')
);
