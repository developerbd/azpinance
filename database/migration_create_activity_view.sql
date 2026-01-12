-- Create a unified view for all activities
-- This enables efficient pagination and filtering across multiple tables

DROP VIEW IF EXISTS view_all_activities;

CREATE OR REPLACE VIEW view_all_activities AS
SELECT 
    id::text as reference_id,
    'forex' as type,
    amount,
    'USD' as currency,
    status,
    'Forex Transaction' as description,
    created_at,
    transaction_date
FROM forex_transactions

UNION ALL

SELECT 
    id::text as reference_id,
    'payment' as type,
    amount,
    'BDT' as currency,
    'completed' as status, -- Supplier payments are strictly records, assumed completed
    'Supplier Payment' as description, -- Default description, or use custom field if exists?
    created_at,
    date as transaction_date
FROM supplier_payments

UNION ALL

SELECT 
    id::text as reference_id,
    'invoice' as type,
    total_amount as amount,
    'BDT' as currency,
    status,
    'Invoice #' || invoice_number as description,
    created_at,
    created_at as transaction_date -- Invoices usually use created_at as the primary date
FROM invoices;

-- Grant access (if RLS is enabled, Views inherit permissions of underlying tables in standard SQL, 
-- but in Supabase/PostgREST we might need to ensure the View is accessible or setup RLS on the view itself if created with security_invoker)
-- For now, standard view creation.
