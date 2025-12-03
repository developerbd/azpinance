import { z } from 'zod';

export const forexTransactionSchema = z.object({
    contact_id: z.string().uuid({ message: "Invalid Contact ID" }),
    account_type: z.enum(['bank', 'mfs', 'crypto', 'wallet', 'credit_card', 'paypal', 'payoneer', 'wise', 'cash', 'other'], { message: "Invalid Account Type" }),
    currency: z.string().min(3).max(3, { message: "Currency must be 3 characters (e.g. USD)" }),
    amount: z.number().positive({ message: "Amount must be positive" }),
    exchange_rate: z.number().positive({ message: "Exchange rate must be positive" }),
    amount_bdt: z.number().positive({ message: "Amount BDT must be positive" }),
    transaction_id: z.string().optional().or(z.literal('')),
    transaction_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    note: z.string().optional().or(z.literal('')),
    attachments: z.array(z.string().url()).optional(),
    receiving_account_id: z.string().uuid().optional().or(z.literal('')),
});

export type ForexTransactionInput = z.infer<typeof forexTransactionSchema>;

export const supplierPaymentSchema = z.object({
    supplier_id: z.string().uuid({ message: "Invalid Supplier ID" }),
    amount: z.number().positive({ message: "Amount must be positive" }),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    destination_account_id: z.string().uuid().optional().or(z.literal('')),
    transaction_method: z.string().min(1, { message: "Transaction method is required" }),
    reference_id: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    attachments: z.array(z.string().url()).optional(),
});

export type SupplierPaymentInput = z.infer<typeof supplierPaymentSchema>;

export const financialAccountSchema = z.object({
    name: z.string().min(1, "Name is required"),
    scope: z.enum(['local', 'international']),
    type: z.string(),
    currency: z.string(),
    category: z.enum(['receiving', 'third_party', 'internal']).default('internal'),
    contact_id: z.string().uuid().optional().or(z.literal('')),
    details: z.record(z.string(), z.any()),
    custom_fields: z.record(z.string(), z.any()),
    attachments: z.array(z.string()),
});

export type FinancialAccountInput = z.infer<typeof financialAccountSchema>;

export const createUserSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
    username: z.string().min(3, { message: "Username must be at least 3 characters" }).optional().or(z.literal('')),
    role: z.enum(['admin', 'supervisor', 'accountant', 'guest'], { message: "Invalid role" }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
