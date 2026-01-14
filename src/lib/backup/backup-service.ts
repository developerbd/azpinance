import archiver from 'archiver';
import { PassThrough } from 'stream';
import { uploadBackup, deleteBackup, listBackups, setCredentials } from './google-drive';
import { google } from 'googleapis';
import { SupabaseClient } from '@supabase/supabase-js';

// Table list (in priority order for restoration)
// We try to auto-discover, but keep this as fallback/core list.
const CORE_TABLES = [
    'users', // Public profiles
    'contacts', // Includes Clients & Suppliers
    'financial_accounts', // Was 'accounts'
    'transactions',
    // 'transaction_categories', // Does not exist in schema (likely handled in app code or views)
    'supplier_payments', // Likely exists from migration
    'digital_expenses', // Likely exists from migration
    'forex_transactions', // Found in migrations
    // 'subscriptions', // Verify if this exists, often part of digital_expenses
    'invoices', // Found in migrations
    'invoice_items',
    'audit_logs',
    'notifications',
    'integration_tokens',
    'system_settings' // Was 'settings'
];

export class BackupService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    // 1. Fetch Table Data as JSON
    private async getTableData(tableName: string): Promise<any[]> {
        let allData: any[] = [];
        const limit = 1000;
        let rangeStart = 0;

        while (true) {
            const { data, error } = await this.supabase
                .from(tableName)
                .select('*')
                .range(rangeStart, rangeStart + limit - 1);

            if (error) {
                // If table doesn't exist, just return empty (don't crash the whole backup)
                if (error.code === '42P01') { // Undefined table
                    return [];
                }
                console.error(`Failed to fetch ${tableName}:`, error.message);
                throw error;
            }

            if (!data || data.length === 0) break;

            allData = [...allData, ...data];

            if (data.length < limit) break; // Finished
            rangeStart += limit;
        }

        return allData;
    }

    // 2. Archive Codebase (Same as before)
    private archiveCodebase(archive: archiver.Archiver) {
        const cwd = process.cwd();
        archive.glob('**/*', {
            cwd: cwd,
            ignore: ['node_modules/**', '.next/**', '.git/**', '.env*', 'tmp/**', 'dist/**']
        }, { prefix: 'app' });
    }

    // 3. Main Backup Function (Universal JS)
    // 3. Main Backup Function (Universal JS)
    async performBackup(type: 'db' | 'codebase' | 'full', tokens: any) {
        let authClient: any;

        if (tokens.client_id && tokens.client_secret) {
            authClient = new google.auth.OAuth2(tokens.client_id, tokens.client_secret);
            authClient.setCredentials({ refresh_token: tokens.refresh_token, access_token: tokens.access_token });
        } else {
            setCredentials(tokens);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let filename = '';
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Metadata
        const manifest = {
            timestamp: new Date().toISOString(),
            type,
            version: process.env.npm_package_version || 'unknown',
            system: 'universal-js', // Tag verification
            tables: [] as string[]
        };

        // Prepare the Zip Stream
        const pass = new PassThrough();
        archive.pipe(pass);

        // --- DATA BACKUP LOGIC ---
        if (type === 'db' || type === 'full') {
            console.log('[BackupInfo] Starting JSON Table Export...');

            // Try to auto-discover tables (optional, often blocked by permissions)
            // fallback to CORE_TABLES
            let tablesToBackup = CORE_TABLES;

            for (const table of tablesToBackup) {
                try {
                    // console.log(`[BackupInfo] Fetching table: ${table}`);
                    const data = await this.getTableData(table);
                    if (data.length > 0) {
                        archive.append(JSON.stringify(data, null, 2), { name: `data/${table}.json` });
                        manifest.tables.push(table);
                    }
                } catch (err: any) {
                    console.warn(`[BackupWarning] Skipped table ${table}: ${err.message}`);
                }
            }

            filename = type === 'db' ? `backup_db_json_${timestamp}.zip` : `backup_full_json_${timestamp}.zip`;
        }

        // --- CODEBASE BACKUP LOGIC ---
        if (type === 'codebase') {
            filename = `backup_code_${timestamp}.zip`;
            this.archiveCodebase(archive);
        } else if (type === 'full') {
            this.archiveCodebase(archive);
            archive.append('# ENV Configuration Required\n# See MIGRATION_GUIDE.md', { name: 'env.config.placeholder' });
        }

        // Add Manifest
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

        // Finalize Zip
        return new Promise((resolve, reject) => {
            archive.on('error', (err) => reject(err));
            pass.on('error', (err) => reject(err));

            console.log(`[BackupInfo] Starting Upload of ${filename}...`);

            uploadBackup(filename, pass, 'application/zip', JSON.stringify(manifest), authClient)
                .then((result) => {
                    resolve(result);
                })
                .catch((err) => reject(err));

            archive.finalize().catch(err => reject(err));
        });
    }

    async rotate(maxBackups: number, tokens: any) {
        setCredentials(tokens);
        const backups = await listBackups(100);
        if (backups.length > maxBackups) {
            const toDelete = backups.slice(maxBackups);
            for (const file of toDelete) {
                if (file.id) await deleteBackup(file.id);
            }
        }
    }
}
