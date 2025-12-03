const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load env vars manually to avoid dotenv dependency issues
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking forex_transactions schema...');

    // Try to select transaction_date
    const { data, error } = await supabase
        .from('forex_transactions')
        .select('transaction_date')
        .limit(1);

    if (error) {
        console.error('Error selecting transaction_date:', error.message);
        console.log('Migration likely NOT applied.');
    } else {
        console.log('Successfully selected transaction_date.');
        console.log('Migration likely applied.');
    }
}

checkSchema();
