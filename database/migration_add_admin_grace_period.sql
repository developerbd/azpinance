-- Migration: Add admin_grace_period_start column
-- Description: Required for Admin 2FA Policy enforcement (Grace Period Timer)

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS admin_grace_period_start TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN public.users.admin_grace_period_start IS 'Timestamp when the 7-day 2FA grace period started for this admin.';
