-- Add timezone column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Comment
COMMENT ON COLUMN public.users.timezone IS 'User preferred timezone (e.g., Asia/Dhaka, Europe/London)';
