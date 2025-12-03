const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = {};
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables in .env.local');
    process.exit(1);
}

// Use Service Key to bypass RLS for debugging
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCashFlow() {
    console.log('--- Debugging Cash Flow Data ---');

    // 1. Contacts
    const { data: contacts, error: contactsError } = await supabase.from('contacts').select('id, name');
    if (contactsError) console.error('Contacts Error:', contactsError);
    console.log(`Contacts Found: ${contacts?.length || 0}`);

    // 2. Forex (Approved)
    const { data: forexData, error: forexError } = await supabase
        .from('forex_transactions')
        .select('contact_id, amount, amount_bdt, status, created_at')
        .eq('status', 'approved');

    if (forexError) console.error('Forex Error:', forexError);
    console.log(`Approved Forex Tx Found: ${forexData?.length || 0}`);
    if (forexData?.length > 0) {
        console.log('Sample Forex:', forexData[0]);
        const totalForex = forexData.reduce((sum, tx) => sum + (Number(tx.amount_bdt) || 0), 0);
        console.log(`Total Forex BDT: ${totalForex}`);
    }

    // 3. Supplier Payments
    const { data: paymentData, error: paymentError } = await supabase
        .from('supplier_payments')
        .select('supplier_id, amount');

    if (paymentError) console.error('Payments Error:', paymentError);
    console.log(`Supplier Payments Found: ${paymentData?.length || 0}`);
    if (paymentData?.length > 0) {
        console.log('Sample Payment:', paymentData[0]);
        const totalPayments = paymentData.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        console.log(`Total Payments BDT: ${totalPayments}`);
    }

    // 4. Aggregation Logic Check
    let totalReceivables = 0;
    let totalPayables = 0;

    if (contacts && forexData && paymentData) {
        const receivablesMap = new Map();
        forexData.forEach(tx => {
            const current = receivablesMap.get(tx.contact_id) || 0;
            receivablesMap.set(tx.contact_id, current + (Number(tx.amount_bdt) || 0));
        });

        const paymentsMap = new Map();
        paymentData.forEach(tx => {
            const current = paymentsMap.get(tx.supplier_id) || 0;
            paymentsMap.set(tx.supplier_id, current + (Number(tx.amount) || 0));
        });

        contacts.forEach(c => {
            const rec = receivablesMap.get(c.id) || 0;
            const pay = paymentsMap.get(c.id) || 0;
            const due = rec - pay;
            if (due > 0) totalReceivables += due;
            if (due < 0) totalPayables += Math.abs(due);
        });
    }

    console.log('--- Aggregation Result ---');
    console.log(`Total Receivables (We overpaid): ${totalReceivables}`);
    console.log(`Total Payables (We owe): ${totalPayables}`);

    // 5. Historical Trends Check
    const startDateHistory = new Date();
    startDateHistory.setDate(startDateHistory.getDate() - 30);

    // Filter for last 30 days
    const recentForex = forexData?.filter(tx => new Date(tx.created_at || new Date()) >= startDateHistory) || [];

    let totalHistoryUSD = 0;
    let totalHistoryBDT = 0;

    recentForex.forEach(tx => {
        totalHistoryUSD += Number(tx.amount || 0); // Assuming 'amount' is USD
        totalHistoryBDT += Number(tx.amount_bdt || 0);
    });

    const avgDailyUSD = totalHistoryUSD / 30;
    const avgRate = totalHistoryUSD > 0 ? (totalHistoryBDT / totalHistoryUSD) : 0;

    console.log('--- Trends (Last 30 Days) ---');
    console.log(`Recent Tx Count: ${recentForex.length}`);
    console.log(`Total USD Inflow: ${totalHistoryUSD}`);
    console.log(`Total BDT Inflow: ${totalHistoryBDT}`);
    console.log(`Avg Daily USD: ${avgDailyUSD}`);
    console.log(`Avg Exchange Rate: ${avgRate}`);
    console.log(`Projected 30d Liability: ${avgDailyUSD * 30 * avgRate}`);
}

debugCashFlow();
