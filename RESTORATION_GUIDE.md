# Disaster Recovery & Restoration Guide

This guide explains exactly what is included in your "Full System Backup" and how to restore it, whether you are staying on Vercel/Supabase or moving to a new provider like Hostinger or a VPS.

## 1. What is in the Backup?

The **Universal JS Backup** (`backup_full_json_DATE.zip`) utilizes a modern, platform-independent approach:

1.  **`data/` (The Database)**
    *   **Format**: Collection of JSON files (e.g., `users.json`, `transactions.json`).
    *   **Content**: Complete data export of all application tables.
    *   **Advantage**: Works on Vercel, Hosting, and Local without needing `pg_dump`.

2.  **`app/` (The Codebase)**
    *   **Includes**: Source code (`src`), config, and public assets.

---

## 2. Restoration Scenario: "One-Click" Script

I have provided a specialized tool to restore these JSON backups easily.

### Prerequisite: Service Key
To restore data (bypassing permission rules), you **must** have the `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local` file.
```env
SUPABASE_SERVICE_ROLE_KEY=eyJxh...
```

### Step 1: Run the Restore Script
1.  Unzip the backup file (optional, or pass the zip path directly).
2.  Open your terminal in the project folder.
3.  Run the restore command:
    ```bash
    npx tsx scripts/restore.ts path/to/backup_full_json_....zip
    ```

### Step 2: What Happens?
*   The script reads your `.env.local` to connect to Supabase as Admin.
*   It extracts the JSON data.
*   It intelligently pushes (upserts) the data back into your database tables.

---

## 3. Legacy / Manual Restoration

If you ever need to manually inspect the data:
1.  Unzip the file.
2.  Open `data/users.json` (or any file) in a text editor.
3.  You can write your own scripts to process this standard JSON data.

---

## 4. Hosting Compatibility (Universal)

✅ **Vercel** | ✅ **VPS** | ✅ **Local**
This new system is 100% compatible with Vercel and all hosting providers because it uses pure JavaScript (HTTP) instead of system binaries. No more DNS errors or "pg_dump not found".
*   **Warning**: cPanel is often slower for Next.js than Vercel.

---

## 5. Hosting Compatibility (Crucial)

Since this Backup Feature relies on a system tool (`pg_dump`), it behaves differently depending on where you host:

### ✅ VPS / Dedicated Server (Hostinger, DigitalOcean, EC2)
*   **Status**: **Fully Supported**.
*   **Requirement**: You must install PostgreSQL Client tools (`sudo apt install postgresql-client`).
*   **Performance**: Excellent. No timeouts.

### ✅ Vercel / Netlify (Serverless)
*   **Status**: **Fully Supported**.
*   **Why**: The new Universal JS Backup uses standard HTTP requests (not `pg_dump`), so it works perfectly on Serverless functions.
*   **Timeout Note**: For extremely large databases (100k+ rows), Vercel's free tier might timeout. In that case, use the VPS instructions or Supabase's built-in backups. But for standard use, it is perfect.

---

## 6. Critical: What You Must Do Manually

The backup **automates 95% of the work**, but for security reasons, it strictly **excludes**:

1.  **Environment Variables (`.env`)**:
    *   **Why?** If your Google Drive is hacked, we don't want them to have your Database Password or API Keys.
    *   **Your Responsibility**: Keep a secure copy of your `.env.local` contents (e.g., in a password manager like 1Password or LastPass). **You cannot run the app without these.**

2.  **Storage Buckets (User Files)**:
    *   The `dump.sql` contains *references* (file paths) to images/PDFs, but **NOT the actual files** stored in Supabase Storage.
    *   **Action**: You should separately backup your Supabase Storage buckets if you have critical documents there, or script a downloader. (Currently, the backup tool handles *Database Data* and *Code*, not *Blob Storage*).

## Summary
*   **Portability**: 100%. The code is standard Next.js, the DB is standard Postgres.
*   **Lock-in**: Zero. You can move to AWS, DigitalOcean, or a physical server easily.
*   **The "Key"**: The only thing you need to "bring yourself" is the `.env` configuration file.
