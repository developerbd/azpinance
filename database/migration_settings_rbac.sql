-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for system_settings
DROP POLICY IF EXISTS "Settings View Policy" ON public.system_settings;
DROP POLICY IF EXISTS "Settings Update Policy" ON public.system_settings;

-- 1. VIEW: All authenticated users can view system settings
CREATE POLICY "Settings View Policy" ON public.system_settings
FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. UPDATE: Admin, Supervisor, Accountant can update system settings
-- (Granular column control is complex, relying on UI and trust for Accountant for now, 
-- or we could add a trigger later to prevent Accountant from changing company info)
CREATE POLICY "Settings Update Policy" ON public.system_settings
FOR UPDATE
USING (
  public.get_my_role() IN ('admin', 'supervisor', 'accountant')
);


-- Update Users Table Policies (Building on top of migration_fix_user_recursion.sql)

-- Drop the previous Insert/Update policies to replace them
DROP POLICY IF EXISTS "Insert Users Policy" ON public.users;
DROP POLICY IF EXISTS "Update Users Policy" ON public.users;

-- 3. INSERT: Admin and Supervisor can create users
CREATE POLICY "Insert Users Policy" ON public.users
FOR INSERT
WITH CHECK (
  public.get_my_role() IN ('admin', 'supervisor')
);

-- 4. UPDATE: 
-- Admin: Can update anyone.
-- Supervisor: Can update 'guest' and 'accountant' users.
-- User: Can update themselves.
CREATE POLICY "Update Users Policy" ON public.users
FOR UPDATE
USING (
  (auth.uid() = id) OR 
  (public.get_my_role() = 'admin') OR
  (
    public.get_my_role() = 'supervisor' AND 
    role IN ('guest', 'accountant')
  )
);
