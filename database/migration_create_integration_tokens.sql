-- Create table for storing integration tokens (Google Drive, etc.)
CREATE TABLE IF NOT EXISTS public.integration_tokens (
    service_name TEXT PRIMARY KEY, -- e.g., 'google_drive'
    refresh_token TEXT NOT NULL,
    access_token TEXT,
    expires_at BIGINT, -- Timestamp in milliseconds
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Only Admins can view/modify
CREATE POLICY "Admins can manage integration tokens" ON public.integration_tokens
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.users WHERE role = 'admin'
        )
    );
