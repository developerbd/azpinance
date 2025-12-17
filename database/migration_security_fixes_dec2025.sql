-- 1. Fix Critical Security: Enable RLS on expense_audit_logs
ALTER TABLE public.expense_audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS Policies for expense_audit_logs

-- Allow authenticated users to INSERT logs (required for server actions performed by users)
CREATE POLICY "Enable insert for authenticated users" 
ON public.expense_audit_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow Admins and Supervisors to VIEW logs
CREATE POLICY "Enable select for admins and supervisors" 
ON public.expense_audit_logs 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  )
);

-- 3. Fix View Warnings: Set security_invoker = true
-- This ensures the view runs with the privileges of the user querying it, respecting underlying RLS.

ALTER VIEW public.view_kpi_receivables SET (security_invoker = true);
ALTER VIEW public.view_kpi_current_balance SET (security_invoker = true);
ALTER VIEW public.view_kpi_avg_buy_rate SET (security_invoker = true);
ALTER VIEW public.view_expense_breakdown SET (security_invoker = true);
ALTER VIEW public.view_monthly_cashflow SET (security_invoker = true);
