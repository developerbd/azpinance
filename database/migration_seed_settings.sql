-- Insert default system settings if not exists
INSERT INTO public.system_settings (id, company_name, company_email, company_address)
VALUES (1, 'My Company', 'info@example.com', '123 Business St')
ON CONFLICT (id) DO NOTHING;
