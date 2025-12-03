-- Rename 'vendor' to 'supplier' in contacts table

-- 1. Drop the existing check constraint
ALTER TABLE public.contacts DROP CONSTRAINT contacts_type_check;

-- 2. Update existing data
UPDATE public.contacts SET type = 'supplier' WHERE type = 'vendor';

-- 3. Add new check constraint with 'supplier' instead of 'vendor'
ALTER TABLE public.contacts ADD CONSTRAINT contacts_type_check 
CHECK (type IN ('client', 'supplier', 'other'));
