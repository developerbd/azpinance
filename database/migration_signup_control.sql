-- 1. Add 'pending' to User Status Constraint
-- We need to drop the existing check constraint and add a new one
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended', 'pending'));

-- 2. Add 'signup_enabled' to System Settings
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS signup_enabled BOOLEAN DEFAULT true;

-- 3. Update the handle_new_user trigger function to strict 'pending' status
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, status, username)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name', 
    'guest', 
    'pending',
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
