import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 0. Load Environment Variables (Manual Parse for robustness)
const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return;
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                process.env[key] = value;
            }
        });
    } catch (e) {
        console.warn('Could not load .env.local');
    }
};
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Error: Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.');
    console.error('This script requires the Service Role Key to bypass RLS during restoration.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const backupFile = process.argv[2];
    if (!backupFile) {
        console.log('Usage: npx tsx scripts/restore.ts <path_to_backup.zip>');
        process.exit(1);
    }

    if (!fs.existsSync(backupFile)) {
        console.error('❌ File not found:', backupFile);
        process.exit(1);
    }

    const tempDir = path.resolve(process.cwd(), 'temp_restore_' + Date.now());
    fs.mkdirSync(tempDir);

    console.log(`📂 Unzipping ${backupFile}...`);
    try {
        execSync(`unzip -q "${backupFile}" -d "${tempDir}"`);
    } catch (e) {
        console.error('❌ Failed to unzip. Ensure "unzip" is installed.');
        process.exit(1);
    }

    // Read Manifest
    let manifest: any = {};
    try {
        const manifestPath = path.join(tempDir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        }
    } catch (e) {
        console.warn('⚠️ No valid manifest.json found. Proceeding with caution.');
    }

    console.log(`ℹ️  Backup Type: ${manifest.type || 'Unknown'}`);
    console.log(`ℹ️  System: ${manifest.system || 'Legacy'}`);

    if (manifest.system === 'universal-js' || (manifest.tables && Array.isArray(manifest.tables))) {
        // Universal JS Restore
        const tables = manifest.tables || [];
        console.log(`📋 Found ${tables.length} tables to restore.`);

        for (const table of tables) {
            const filePath = path.join(tempDir, 'data', `${table}.json`);
            if (fs.existsSync(filePath)) {
                await restoreTable(table, filePath);
            } else {
                console.warn(`⚠️ Data file missing for table: ${table}`);
            }
        }
    } else {
        // Legacy SQL Restore (if someone tries to use this script on old backup)
        console.error('❌ This script supports "Universal JS" backups (JSON).');
        console.error('For SQL dumps (.sql), please use standard "psql" command.');
    }

    // Cleanup
    console.log('🧹 Cleaning up...');
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('✅ Restoration Complete!');
}

async function restoreTable(table: string, filePath: string) {
    console.log(`Populating table: ${table}...`);
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);

        if (!Array.isArray(data) || data.length === 0) {
            console.log(`   Internal: No data in file.`);
            return;
        }

        // Chunking
        const chunkSize = 1000;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            const { error } = await supabase.from(table).upsert(chunk, {
                ignoreDuplicates: false, // We want to overwrite/update
                onConflict: 'id' // Assumes ID is primary key. Adjust if needed.
            });

            if (error) {
                console.error(`   ❌ Error upserting ${table} (chunk ${i}):`, error.message);
            } else {
                process.stdout.write('.');
            }
        }
        console.log(' Done.');

    } catch (e: any) {
        console.error(`   ❌ Failed to restore ${table}:`, e.message);
    }
}

main();
