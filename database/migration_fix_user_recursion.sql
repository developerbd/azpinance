-- Fix Infinite Recursion in Users Table Policies

-- 1. Create a helper function to get the current user's role safely
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the creator (postgres/admin),
-- bypassing RLS on the users table to avoid recursion.
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

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "View Users Policy" ON public.users;
DROP POLICY IF EXISTS "Update Users Policy" ON public.users;
DROP POLICY IF EXISTS "Insert Users Policy" ON public.users;
DROP POLICY IF EXISTS "Delete Users Policy" ON public.users;
DROP POLICY IF EXISTS "Admins have full access" ON public.users; -- Cleanup old one if exists

-- 3. Re-create policies using the safe function

-- SELECT: Admins, Supervisors, Accountants can view all. Users can view themselves.
CREATE POLICY "View Users Policy" ON public.users
FOR SELECT USING (
  (auth.uid() = id) OR 
  (public.get_my_role() IN ('admin', 'supervisor', 'accountant'))
);

-- UPDATE: Admins can update all. Users can update themselves.
CREATE POLICY "Update Users Policy" ON public.users
FOR UPDATE USING (
  (auth.uid() = id) OR 
  (public.get_my_role() = 'admin')
);

-- INSERT: Only Admins
CREATE POLICY "Insert Users Policy" ON public.users
FOR INSERT WITH CHECK (
  public.get_my_role() = 'admin'
);

-- DELETE: Only Admins
CREATE POLICY "Delete Users Policy" ON public.users
FOR DELETE USING (
  public.get_my_role() = 'admin'
);
