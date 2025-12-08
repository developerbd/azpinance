import { z } from 'zod';
import { tool } from 'ai';
import { getComprehensiveDashboardStats } from '@/app/actions/get-comprehensive-dashboard-stats';
import { getSupplierPayments } from '@/app/actions/get-supplier-payments';
import { getDigitalExpenses } from '@/app/actions/digital-expenses/get-expenses';
import { createClient } from '@/lib/supabase/server';

export const tools = {
    get_current_date_time: tool({
        description: 'Get the current date and time in the user\'s timezone. Use this when the user asks about "today", "now", "current date", or any time-related queries.',
        inputSchema: z.object({}),
        execute: async () => {
            const supabase = await createClient();

            // Fetch system timezone setting
            const { data: settings } = await supabase
                .from('system_settings')
                .select('timezone')
                .single();

            const timezone = settings?.timezone || 'Asia/Dhaka';

            // Get current date/time in the specified timezone
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                weekday: 'long',
                hour12: true
            });

            const formatted = formatter.format(now);

            return {
                current_datetime: formatted,
                timezone: timezone,
                iso_string: now.toISOString(),
                timestamp: now.getTime()
            };
        },
    }),

    get_financial_snapshot: tool({
        description: 'Get a comprehensive snapshot of the company financial health, including total volume, active float, supplier dues, and recent activity. Use this for general financial overview questions.',
        inputSchema: z.object({}),
        execute: async () => {
            const stats = await getComprehensiveDashboardStats();
            return stats;
        },
    }),

    search_contacts: tool({
        description: 'Search for contacts (suppliers, customers, employees) by name or type. Returns contact details including ID, name, type, and contact information.',
        inputSchema: z.object({
            query: z.string().optional().describe('Search term to filter contacts by name'),
            type: z.enum(['supplier', 'customer', 'employee']).optional().describe('Filter by contact type'),
        }),
        execute: async ({ query, type }) => {
            const supabase = await createClient();

            let queryBuilder = supabase
                .from('contacts')
                .select('id, name, type, email, phone, company, is_active')
                .order('name');

            if (query) {
                queryBuilder = queryBuilder.ilike('name', `%${query}%`);
            }

            if (type) {
                queryBuilder = queryBuilder.eq('type', type);
            }

            const { data, error } = await queryBuilder.limit(10);

            if (error) return { error: error.message };

            return data?.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                email: c.email,
                phone: c.phone,
                company: c.company,
                is_active: c.is_active
            }));
        },
    }),

    get_digital_expenses: tool({
        description: 'Get digital expenses and subscriptions. Use this when user asks about digital expenses, subscriptions, recurring payments, or specific expense categories.',
        inputSchema: z.object({
            status: z.enum(['pending', 'approved', 'rejected']).optional().describe('Filter by approval status'),
            category: z.string().optional().describe('Filter by category (e.g., "Software", "Marketing")'),
            limit: z.number().optional().default(10),
        }),
        execute: async ({ status, category, limit }) => {
            const result = await getDigitalExpenses({
                page: 1,
                pageSize: limit || 10,
                status,
                category
            });

            if ('error' in result) return { error: result.error };

            return result.data?.map(e => ({
                description: e.description,
                amount: e.amount,
                currency: e.currency,
                category: e.category,
                payment_date: e.payment_date,
                status: e.status,
                is_recurring: e.is_recurring,
                recurring_frequency: e.recurring_frequency,
                next_renewal_date: e.next_renewal_date
            }));
        },
    }),

    get_recent_forex: tool({
        description: 'Get recent forex (foreign exchange) transactions. Use this when user asks about currency exchanges, forex transactions, or USD/BDT conversions.',
        inputSchema: z.object({
            limit: z.number().optional().default(10),
        }),
        execute: async ({ limit }) => {
            const supabase = await createClient();

            const { data, error } = await supabase
                .from('forex_transactions')
                .select('*')
                .order('transaction_date', { ascending: false })
                .limit(limit || 10);

            if (error) return { error: error.message };

            return data?.map(f => ({
                transaction_date: f.transaction_date,
                usd_amount: f.usd_amount,
                bdt_amount: f.bdt_amount,
                exchange_rate: f.exchange_rate,
                purpose: f.purpose,
                notes: f.notes
            }));
        },
    }),

    get_invoice_status: tool({
        description: 'Get invoice information and status. Use this when user asks about invoices, billing, or payment status.',
        inputSchema: z.object({
            status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional().describe('Filter by invoice status'),
            limit: z.number().optional().default(10),
        }),
        execute: async ({ status, limit }) => {
            const supabase = await createClient();

            let query = supabase
                .from('invoices')
                .select('*, contacts(name)')
                .order('created_at', { ascending: false })
                .limit(limit || 10);

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) return { error: error.message };

            return data?.map(inv => ({
                invoice_number: inv.invoice_number,
                customer_name: inv.contacts?.name,
                amount: inv.total_amount,
                status: inv.status,
                issue_date: inv.issue_date,
                due_date: inv.due_date
            }));
        },
    }),

    get_supplier_payments: tool({
        description: 'Get payment history for a specific supplier. Requires supplier ID (use search_contacts first to get the ID).',
        inputSchema: z.object({
            supplier_id: z.string().uuid().describe('The UUID of the supplier (get this from search_contacts first)'),
            limit: z.number().optional().default(5),
        }),
        execute: async ({ supplier_id, limit }) => {
            const result = await getSupplierPayments(supplier_id, 1, limit);
            if ('error' in result) return { error: result.error };

            return result.data?.map(p => ({
                date: p.date,
                amount: p.amount,
                notes: p.notes
            }));
        },
    }),

    get_financial_accounts: tool({
        description: 'Get all financial accounts (bank accounts, mobile banking, cash) with their current balances and details. Use this when user asks about accounts, balances, or "how many accounts".',
        inputSchema: z.object({}),
        execute: async () => {
            const supabase = await createClient();

            const { data, error } = await supabase
                .from('financial_accounts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) return { error: error.message };

            return {
                total_accounts: data?.length || 0,
                accounts: data?.map(acc => ({
                    name: acc.name,
                    type: acc.type,
                    balance: acc.balance,
                    currency: acc.currency,
                    account_number: acc.account_number,
                    bank_name: acc.bank_name,
                    is_active: acc.is_active
                })) || []
            };
        },
    }),
};
