-- Fix: Allow users to view their own profile (and Admins/Supervisors to view all)
-- This is required for:
-- 1. Users to fetch their own role (for RBAC checks).
-- 2. Supervisors/Admins to view the User Management list.

DROP POLICY IF EXISTS "View Users Policy" ON public.users;

CREATE POLICY "View Users Policy" ON public.users
FOR SELECT
USING (
  -- Users can view their own profile
  (auth.uid() = id) 
  OR 
  -- Admins and Supervisors can view all profiles
  (public.get_my_role() IN ('admin', 'supervisor'))
);
