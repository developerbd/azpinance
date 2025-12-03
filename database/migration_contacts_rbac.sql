-- Enable RLS on contacts table (if not already enabled)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to ensure clean slate)
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
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  )
);

-- 3. UPDATE: Only Admin and Supervisor can update contacts
CREATE POLICY "Contacts Update Policy" ON public.contacts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  )
);

-- 4. DELETE: Only Admin can delete contacts
CREATE POLICY "Contacts Delete Policy" ON public.contacts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
