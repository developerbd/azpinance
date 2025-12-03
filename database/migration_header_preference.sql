-- Add header_display_preference column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS header_display_preference text DEFAULT 'avatar_only';

-- Add check constraint for valid values
ALTER TABLE public.users 
ADD CONSTRAINT check_header_display_preference 
CHECK (header_display_preference IN ('avatar_only', 'avatar_full_name', 'full_name_only', 'avatar_username'));
