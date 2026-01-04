-- Optimization Indexes
-- Create indexes for foreign keys and frequently filtered/sorted columns

-- Forex Transactions
CREATE INDEX IF NOT EXISTS idx_forex_transactions_contact_id ON public.forex_transactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_forex_transactions_user_id ON public.forex_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_forex_transactions_status ON public.forex_transactions(status);
CREATE INDEX IF NOT EXISTS idx_forex_transactions_created_at ON public.forex_transactions(created_at DESC);

-- Supplier Payments
CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON public.supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_destination_account_id ON public.supplier_payments(destination_account_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON public.supplier_payments(date DESC);

-- Digital Expenses
CREATE INDEX IF NOT EXISTS idx_digital_expenses_category ON public.digital_expenses(category);
CREATE INDEX IF NOT EXISTS idx_digital_expenses_transaction_date ON public.digital_expenses(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_digital_expenses_status ON public.digital_expenses(status);

-- Contacts
-- CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id); -- Removed: Column does not exist
