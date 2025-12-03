-- Add timezone column to system_settings
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Update existing record if any (assuming id=1 is the main record)
UPDATE system_settings 
SET timezone = 'UTC' 
WHERE timezone IS NULL;
