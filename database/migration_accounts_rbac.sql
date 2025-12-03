-- Enable RLS on financial_accounts table (if not already enabled)
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to ensure clean slate)
DROP POLICY IF EXISTS "Accounts View Policy" ON public.financial_accounts;
DROP POLICY IF EXISTS "Accounts Insert Policy" ON public.financial_accounts;
DROP POLICY IF EXISTS "Accounts Update Policy" ON public.financial_accounts;
DROP POLICY IF EXISTS "Accounts Delete Policy" ON public.financial_accounts;

-- 1. VIEW: All authenticated users can view accounts
CREATE POLICY "Accounts View Policy" ON public.financial_accounts
FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. INSERT: Only Admin and Supervisor can add accounts
CREATE POLICY "Accounts Insert Policy" ON public.financial_accounts
FOR INSERT
WITH CHECK (
  public.get_my_role() IN ('admin', 'supervisor')
);

-- 3. UPDATE: Only Admin and Supervisor can update accounts
CREATE POLICY "Accounts Update Policy" ON public.financial_accounts
FOR UPDATE
USING (
  public.get_my_role() IN ('admin', 'supervisor')
);

-- 4. DELETE: Only Admin can delete accounts
CREATE POLICY "Accounts Delete Policy" ON public.financial_accounts
FOR DELETE
USING (
  public.get_my_role() = 'admin'
);
