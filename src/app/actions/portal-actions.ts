'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Toggles the portal access for a contact.
 * Generates a token if one doesn't exist when enabling.
 */
export async function togglePortalAccess(contactId: string, isActive: boolean) {
    const supabase = await createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('Unauthorized')
    }

    // Use Admin client to bypass RLS if needed, or ensuring we can update the token specific fields
    // Using admin client ensures we can set the token which might be protected
    const adminSupabase = createAdminClient()

    let updateData: any = { is_portal_active: isActive }

    if (isActive) {
        // Check if token exists
        const { data: contact } = await adminSupabase
            .from('contacts')
            .select('portal_token')
            .eq('id', contactId)
            .single()

        if (!contact?.portal_token) {
            updateData.portal_token = crypto.randomUUID()
        }
    }

    const { error } = await adminSupabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)

    if (error) {
        console.error('Error toggling portal access:', error)
        throw new Error('Failed to update portal access')
    }

    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
}

/**
 * Regenerates the portal token for a contact.
 */
export async function regeneratePortalToken(contactId: string) {
    const supabase = await createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('Unauthorized')
    }

    const adminSupabase = createAdminClient()
    const newToken = crypto.randomUUID()

    const { error } = await adminSupabase
        .from('contacts')
        .update({ portal_token: newToken })
        .eq('id', contactId)

    if (error) {
        console.error('Error regenerating token:', error)
        throw new Error('Failed to regenerate token')
    }

    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
}

/**
 * Validates the token and fetches the supplier dashboard data.
 * Publicly accessible (no auth required), protected by the token.
 * Added pagination support: page & limit (default 20)
 * Note: To keep it simple in one query, we might fetch recent items or separate actions. 
 * For now, let's fetch ALL stats for accuracy, but limit the returned list for UI.
 */
export async function getSupplierPortalData(token: string, forexPage = 1, payPage = 1, limit = 20) {
    const adminSupabase = createAdminClient()

    // 1. Verify Token & Get Supplier
    const { data: contact, error: contactError } = await adminSupabase
        .from('contacts')
        .select('id, name, company_name, email, phone, portal_token, is_portal_active')
        .eq('portal_token', token)
        .single()

    if (contactError || !contact || !contact.is_portal_active) {
        throw new Error('Invalid or inactive portal token')
    }

    // 2. Aggregate Stats
    // A. Forex Stats 
    // - Volume (USD): All transactions (or just approved? Usually volume implies all valid business, let's stick to 'approved' for consistency with "receivables", or 'all' if user wants potential. User said "total forex transaction amount", usually approved. I will use 'approved' to be safe and consistent with 'Due'.)
    // - Due (BDT): Approved only.
    const { data: allForex, error: forexStatError } = await adminSupabase
        .from('forex_transactions')
        .select('amount, amount_bdt, created_at, status')
        .eq('contact_id', contact.id)
        .eq('status', 'approved')

    if (forexStatError) throw new Error('Failed to fetch forex stats')

    // B. Payment Stats
    const { data: allPayments, error: payStatError } = await adminSupabase
        .from('supplier_payments')
        .select('amount')
        .eq('supplier_id', contact.id)

    if (payStatError) throw new Error('Failed to fetch payment stats')

    // C. Perform Calculation
    const totalForexUSD = allForex.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
    const totalForexReceivablesBDT = allForex.reduce((sum, tx) => sum + (Number(tx.amount_bdt) || 0), 0)
    const totalPayments = allPayments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0)

    // Current Due = Total Approved Forex (BDT) - Total Payments
    const currentDue = totalForexReceivablesBDT - totalPayments

    // Current Month Calc (USD)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const currentMonthForexUSD = allForex
        .filter(tx => {
            const d = new Date(tx.created_at)
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })
        .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)

    // 3. Fetch Paginated Lists

    // Forex List
    const { data: recentForex, count: forexCount, error: listError } = await adminSupabase
        .from('forex_transactions')
        .select('*', { count: 'exact' })
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .range((forexPage - 1) * limit, forexPage * limit - 1)

    // Payments List
    const { data: recentPayments, count: payCount, error: payListError } = await adminSupabase
        .from('supplier_payments')
        .select('*', { count: 'exact' })
        .eq('supplier_id', contact.id)
        .order('date', { ascending: false })
        .range((payPage - 1) * limit, payPage * limit - 1)

    return {
        contact: {
            name: contact.name,
            company_name: contact.company_name,
            email: contact.email,
        },
        stats: {
            totalForexUSD,
            currentMonthForexUSD,
            totalForexReceivablesBDT,
            totalPayments,
            currentDue
        },
        transactions: {
            data: recentForex || [],
            meta: {
                page: forexPage,
                limit,
                total: forexCount || 0,
                totalPages: Math.ceil((forexCount || 0) / limit)
            }
        },
        payments: {
            data: recentPayments || [],
            meta: {
                page: payPage,
                limit,
                total: payCount || 0,
                totalPages: Math.ceil((payCount || 0) / limit)
            }
        }
    }
}
