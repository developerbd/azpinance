import archiver from 'archiver';
import { spawn } from 'child_process';
import { PassThrough } from 'stream';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { uploadBackup, deleteBackup, listBackups, setCredentials } from './google-drive';

const execAsync = util.promisify(exec);

// Helper to check if a command exists (for pg_dump check)
const commandExists = (cmd: string) => {
    try {
        const check = spawn(cmd, ['--version']);
        check.on('error', () => { });
        return true; // Simplified check, assumes if spawn doesn't crash immediately it might exist, effective check is handling error later.
    } catch {
        return false;
    }
};

export class BackupService {
    private dbUrl: string;

    constructor(dbUrl: string) {
        this.dbUrl = dbUrl;
    }

    // 1. Generate DB Dump Stream
    private getDbDumpStream(): PassThrough {
        const stream = new PassThrough();

        // Parse DB URL for pg_dump
        // postgres://user:pass@host:port/db
        const env = { ...process.env, PGPASSWORD: this.getPasswordFromUrl(this.dbUrl) };
        const args = this.getPgDumpArgs(this.dbUrl);

        console.log('Starting pg_dump with args:', args);

        const pgDump = spawn('pg_dump', args, { env });

        pgDump.stdout.pipe(stream);

        pgDump.stderr.on('data', (data) => {
            console.error('pg_dump stderr:', data.toString());
        });

        pgDump.on('error', (err) => {
            console.error('pg_dump failed to start:', err);
            stream.destroy(err);
        });

        return stream;
    }

    // 2. Archive Codebase
    private archiveCodebase(archive: archiver.Archiver) {
        // Add all files in current directory to 'app/' in zip
        // Exclude huge/unnecessary folders
        const cwd = process.cwd();
        archive.glob('**/*', {
            cwd: cwd,
            ignore: ['node_modules/**', '.next/**', '.git/**', '.env*', 'tmp/**']
        }, { prefix: 'app' });
    }

    // 3. Main Backup Function
    async performBackup(type: 'db' | 'codebase' | 'full', tokens: any) {
        setCredentials(tokens);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let filename = '';
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Metadata
        const manifest = {
            timestamp: new Date().toISOString(),
            type,
            version: process.env.npm_package_version || 'unknown',
            commit: await this.getGitCommit()
        };
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

        if (type === 'db') {
            filename = `backup_db_${timestamp}.zip`;
            archive.append(this.getDbDumpStream(), { name: 'dump.sql' });
        }
        else if (type === 'codebase') {
            filename = `backup_code_${timestamp}.zip`;
            this.archiveCodebase(archive);
        }
        else if (type === 'full') {
            filename = `backup_full_${timestamp}.zip`;
            archive.append(this.getDbDumpStream(), { name: 'dump.sql' });
            this.archiveCodebase(archive);
            // Also include .env safely? NO, SECURITY RISK. User must configure env manually.
            archive.append('# ENV Configuration Required\n# See MIGRATION_GUIDE.md', { name: 'env.config.placeholder' });
        }

        // Finalize Zip and Pipe to Upload
        // We need a PassThrough because archiver pushes, google drive pulls
        const pass = new PassThrough();
        archive.pipe(pass);

        // Start Archiving
        archive.finalize();

        // Start Uploading (Wait for it)
        try {
            const result = await uploadBackup(filename, pass, 'application/zip', JSON.stringify(manifest));
            return result;
        } catch (error) {
            console.error('Backup Upload Failed:', error);
            throw error;
        }
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

    private getPasswordFromUrl(url: string) {
        try {
            const parsed = new URL(url);
            return parsed.password;
        } catch { return ''; }
    }

    private getPgDumpArgs(url: string) {
        const parsed = new URL(url);
        return [
            '-h', parsed.hostname,
            '-p', parsed.port || '5432',
            '-U', parsed.username,
            '-d', parsed.pathname.substring(1), // remove leading slash
            '--no-owner', // Supabase specific: Don't try to set ownership
            '--no-acl',   // Supabase specific: skip privileges
            '--clean',    // Drop commands
            '--if-exists'
        ];
    }

    private async getGitCommit() {
        try {
            const { stdout } = await execAsync('git rev-parse HEAD');
            return stdout.trim();
        } catch {
            return 'unknown';
        }
    }
}
