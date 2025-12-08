-- Super Admin and 2FA Exemption Migration
-- Adds columns to support super admin protections and 2FA exemption management

-- Add is_super_admin column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Add is_2fa_exempt column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_2fa_exempt BOOLEAN DEFAULT FALSE;

-- Set super admin status for user 'moniruss'
UPDATE users 
SET is_super_admin = TRUE 
WHERE username = 'moniruss';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON users(is_super_admin) WHERE is_super_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_is_2fa_exempt ON users(is_2fa_exempt) WHERE is_2fa_exempt = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN users.is_super_admin IS 'Identifies the super admin user who cannot be deleted, suspended, or have role changed';
COMMENT ON COLUMN users.is_2fa_exempt IS 'Indicates if admin user is exempt from 2FA requirements (can only be set by super admin)';
