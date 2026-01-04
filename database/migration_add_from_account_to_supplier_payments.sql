-- Add from_account_id column to supplier_payments table
ALTER TABLE supplier_payments 
ADD COLUMN from_account_id UUID REFERENCES financial_accounts(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN supplier_payments.from_account_id IS 'The account from which the payment is made (our account)';
