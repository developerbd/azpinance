-- Add Discord webhook to system settings
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS discord_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;

COMMENT ON COLUMN system_settings.discord_enabled IS 'Enable Discord notifications system-wide';
COMMENT ON COLUMN system_settings.discord_webhook_url IS 'Discord webhook URL for all admin notifications';
