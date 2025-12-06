-- Enable pg_trgm extension for fast text search if not enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Forex Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_forex_status ON forex_transactions(status);
CREATE INDEX IF NOT EXISTS idx_forex_date ON forex_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_forex_created_at ON forex_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_forex_contact_id ON forex_transactions(contact_id);

-- Supplier Payments Indexes
-- Note: supplier_payments table uses 'date', not 'payment_date', and 'supplier_id' not 'contact_id'
CREATE INDEX IF NOT EXISTS idx_sp_date ON supplier_payments(date);
CREATE INDEX IF NOT EXISTS idx_sp_supplier_id ON supplier_payments(supplier_id);

-- Digital Expenses Indexes
CREATE INDEX IF NOT EXISTS idx_de_status ON digital_expenses(status);
CREATE INDEX IF NOT EXISTS idx_de_transaction_date ON digital_expenses(transaction_date);
CREATE INDEX IF NOT EXISTS idx_de_vendor_platform ON digital_expenses(vendor_platform);

-- Invoices Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_contact_id ON invoices(contact_id);

-- Contacts Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin (name gin_trgm_ops); -- Fast fuzzy search
