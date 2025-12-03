-- Change default value for header_display_preference to 'avatar_full_name'
ALTER TABLE public.users 
ALTER COLUMN header_display_preference SET DEFAULT 'avatar_full_name';

-- Update the handle_new_user trigger to explicitly set the preference (optional but good for clarity)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, username, header_display_preference)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'guest',
    new.raw_user_meta_data->>'username',
    'avatar_full_name' -- Explicitly set default
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
