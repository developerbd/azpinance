-- Fix Contacts RBAC Policies using get_my_role()

-- Ensure get_my_role exists and is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  RETURN user_role;
END;
$$;

-- Drop existing policies on contacts
DROP POLICY IF EXISTS "Contacts View Policy" ON public.contacts;
DROP POLICY IF EXISTS "Contacts Insert Policy" ON public.contacts;
DROP POLICY IF EXISTS "Contacts Update Policy" ON public.contacts;
DROP POLICY IF EXISTS "Contacts Delete Policy" ON public.contacts;

-- 1. VIEW: All authenticated users can view contacts
CREATE POLICY "Contacts View Policy" ON public.contacts
FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. INSERT: Only Admin and Supervisor can add contacts
CREATE POLICY "Contacts Insert Policy" ON public.contacts
FOR INSERT
WITH CHECK (
  public.get_my_role() IN ('admin', 'supervisor')
);

-- 3. UPDATE: Only Admin and Supervisor can update contacts
CREATE POLICY "Contacts Update Policy" ON public.contacts
FOR UPDATE
USING (
  public.get_my_role() IN ('admin', 'supervisor')
);

-- 4. DELETE: Only Admin can delete contacts
CREATE POLICY "Contacts Delete Policy" ON public.contacts
FOR DELETE
USING (
  public.get_my_role() = 'admin'
);
