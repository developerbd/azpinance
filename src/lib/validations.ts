import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional();
export const urlSchema = z.string().url('Invalid URL').optional();
export const positiveNumberSchema = z.number().positive('Must be a positive number');
export const currencySchema = z.string().length(3, 'Currency must be 3 characters (e.g., USD, BDT)');

// Forex Transaction Schema
export const ForexTransactionSchema = z.object({
    amount: positiveNumberSchema,
    currency: currencySchema,
    exchange_rate: positiveNumberSchema,
    purpose: z.string().min(3, 'Purpose must be at least 3 characters').max(500),
    beneficiary_name: z.string().min(2).max(200),
    beneficiary_account: z.string().min(5).max(100),
    bank_name: z.string().min(2).max(200),
    payment_method: z.enum(['bank_transfer', 'cash', 'online', 'other']),
    status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
    payment_status: z.enum(['unpaid', 'paid']).default('unpaid'),
    transaction_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    notes: z.string().max(1000).optional(),
});

export type ForexTransactionInput = z.infer<typeof ForexTransactionSchema>;

// Supplier Payment Schema
export const SupplierPaymentSchema = z.object({
    supplier_id: z.string().uuid('Invalid supplier ID'),
    amount: positiveNumberSchema,
    payment_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    payment_method: z.enum(['bank_transfer', 'cash', 'check', 'online', 'other']),
    reference_number: z.string().max(100).optional(),
    notes: z.string().max(1000).optional(),
    invoice_numbers: z.array(z.string()).optional(),
});

export type SupplierPaymentInput = z.infer<typeof SupplierPaymentSchema>;

// Financial Account Schema
export const FinancialAccountSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(200),
    type: z.enum(['bank', 'cash', 'mobile_banking', 'other']),
    account_number: z.string().max(100).optional(),
    bank_name: z.string().max(200).optional(),
    branch: z.string().max(200).optional(),
    balance: z.number().default(0),
    currency: currencySchema.default('BDT'),
    status: z.enum(['active', 'inactive']).default('active'),
    notes: z.string().max(1000).optional(),
});

export type FinancialAccountInput = z.infer<typeof FinancialAccountSchema>;

// Digital Expense Schema
export const DigitalExpenseSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    category: z.enum(['software', 'hosting', 'domain', 'marketing', 'other']),
    amount_usd: positiveNumberSchema,
    payment_method: z.enum(['credit_card', 'paypal', 'bank_transfer', 'other']),
    payment_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    is_recurring: z.boolean().default(false),
    recurring_frequency: z.enum(['monthly', 'yearly', 'quarterly']).optional(),
    next_renewal_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    vendor: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});

export type DigitalExpenseInput = z.infer<typeof DigitalExpenseSchema>;

// Contact Schema
export const ContactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(200),
    type: z.enum(['client', 'supplier', 'other']),
    email: emailSchema.optional(),
    phone: phoneSchema,
    company_name: z.string().max(200).optional(),
    website: urlSchema,
    facebook: urlSchema,
    address: z.string().max(500).optional(),
    status: z.enum(['active', 'suspended', 'archived']).default('active'),
    custom_fields: z.record(z.any()).optional(),
    attachments: z.array(z.string()).optional(),
});

export type ContactInput = z.infer<typeof ContactSchema>;

// Invoice Schema
export const InvoiceItemSchema = z.object({
    description: z.string().min(1).max(500),
    quantity: positiveNumberSchema,
    unit_price: positiveNumberSchema,
    amount: positiveNumberSchema,
});

export const InvoiceSchema = z.object({
    contact_id: z.string().uuid('Invalid contact ID'),
    type: z.enum(['invoice', 'bill']),
    issue_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    due_date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    currency: currencySchema,
    notes: z.string().max(1000).optional(),
    items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
    tax_rate: z.number().min(0).max(100).optional(),
});

export type InvoiceInput = z.infer<typeof InvoiceSchema>;

// User Schema
export const UserSchema = z.object({
    email: emailSchema,
    full_name: z.string().min(2).max(200),
    role: z.enum(['admin', 'supervisor', 'accountant']),
    status: z.enum(['active', 'suspended']).default('active'),
});

export type UserInput = z.infer<typeof UserSchema>;

// SMTP Settings Schema
export const SmtpSettingsSchema = z.object({
    host: z.string().min(1, 'SMTP host is required'),
    port: z.number().int().min(1).max(65535),
    user: emailSchema,
    password: z.string().min(1, 'SMTP password is required'),
    from_email: emailSchema,
    sender_name: z.string().max(200).optional(),
});

export type SmtpSettingsInput = z.infer<typeof SmtpSettingsSchema>;
