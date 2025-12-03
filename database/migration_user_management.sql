-- Update RLS policies for public.users table

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins have full access" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 1. SELECT Policy
-- Admins, Supervisors, and Accountants can view all users.
-- Regular users (Guests) can only view their own profile.
CREATE POLICY "View Users Policy" ON public.users
FOR SELECT USING (
  (auth.uid() = id) OR 
  (exists (select 1 from public.users where id = auth.uid() and role IN ('admin', 'supervisor', 'accountant')))
);

-- 2. UPDATE Policy
-- Admins can update any user.
-- Users can update their own profile (but NOT their role or status).
-- We'll handle the field restrictions in the application logic or via a separate trigger if needed, 
-- but for RLS, we allow update if it's their own ID or if the requester is an admin.
CREATE POLICY "Update Users Policy" ON public.users
FOR UPDATE USING (
  (auth.uid() = id) OR 
  (exists (select 1 from public.users where id = auth.uid() and role = 'admin'))
);

-- 3. INSERT Policy
-- Only Admins can insert new users (via the User Management UI which might trigger a function or direct insert if using a specific flow).
-- Note: Standard signup is handled by the trigger on auth.users. This policy is for manual creation if applicable.
CREATE POLICY "Insert Users Policy" ON public.users
FOR INSERT WITH CHECK (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- 4. DELETE Policy
-- Only Admins can delete users.
CREATE POLICY "Delete Users Policy" ON public.users
FOR DELETE USING (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
