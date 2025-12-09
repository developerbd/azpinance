-- Migration: Add database indexes for performance optimization
-- Date: 2025-12-09
-- Description: Adds indexes on frequently queried columns to improve query performance

-- Index on forex_transactions.status (used in filtering approved/pending transactions)
CREATE INDEX IF NOT EXISTS idx_forex_transactions_status 
ON forex_transactions(status);

-- Index on forex_transactions.contact_id (used in joins and filtering by contact)
CREATE INDEX IF NOT EXISTS idx_forex_transactions_contact_id 
ON forex_transactions(contact_id);

-- Index on supplier_payments.supplier_id (used in joins and filtering by supplier)
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id 
ON supplier_payments(supplier_id);

-- Index on digital_expenses.status (used in filtering approved/pending/rejected expenses)
CREATE INDEX IF NOT EXISTS idx_digital_expenses_status 
ON digital_expenses(status);

-- Index on invoices.status (used in filtering paid/unpaid invoices)
CREATE INDEX IF NOT EXISTS idx_invoices_status 
ON invoices(status);

-- Index on forex_transactions.transaction_date (used in date range queries and sorting)
CREATE INDEX IF NOT EXISTS idx_forex_transactions_date 
ON forex_transactions(transaction_date DESC);

-- Index on supplier_payments.date (used in date range queries and sorting)
CREATE INDEX IF NOT EXISTS idx_supplier_payments_date 
ON supplier_payments(date DESC);

-- Index on digital_expenses.transaction_date (used in date range queries)
CREATE INDEX IF NOT EXISTS idx_digital_expenses_date 
ON digital_expenses(transaction_date DESC);

-- Composite index on forex_transactions for common query pattern (status + date)
CREATE INDEX IF NOT EXISTS idx_forex_transactions_status_date 
ON forex_transactions(status, transaction_date DESC);

-- Add comments for documentation
COMMENT ON INDEX idx_forex_transactions_status IS 'Improves performance of status-based filtering';
COMMENT ON INDEX idx_forex_transactions_contact_id IS 'Improves performance of contact-based queries and joins';
COMMENT ON INDEX idx_supplier_payments_supplier_id IS 'Improves performance of supplier-based queries and joins';
COMMENT ON INDEX idx_digital_expenses_status IS 'Improves performance of status-based filtering';
COMMENT ON INDEX idx_invoices_status IS 'Improves performance of invoice status queries';
