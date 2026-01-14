# Migration & Restoration Guide

This document provides a step-by-step guide on how to migrate the **Biz Ad Finance** application to a new server, restore backups, and ensure continuous operation.

## 1. Prerequisites
Before migrating, ensure you have the **Backup Zip File** (`backup_full_json_....zip`) downloaded from Google Drive or the Settings page.

---

## 2. Platform A: Vercel (Recommended)
If you are moving to a new Vercel project:

1.  **Code**: Unzip `backup_code_....zip` (found inside the full backup) and push it to a new GitHub repository. Import it to Vercel.
2.  **Environment**: Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `CRON_SECRET` to Vercel Settings.
3.  **Database**: Create a new Supabase project.
4.  **Restore Data**:
    *   Clone your new repo locally.
    *   Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
    *   Run `npx tsx scripts/restore.ts path/to/backup.zip` locally. The script will push data to your new Supabase DB.

---

## 3. Platform B: Hostinger / VPS (Ubuntu)

### 3.1 Server Setup
Connect to your new server via SSH:
```bash
ssh root@your-server-ip
```

### 3.2 Install Dependencies
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs unzip

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

### 3.3 Deploy Code
Upload the `backup_code_....zip` content to `/var/www/bizad-finance` (or similar).
```bash
cd /var/www/bizad-finance
npm install
npm run build
```

### 3.4 Configure Environment
Create a `.env` file:
```bash
nano .env
```
Add:
```env
NEXT_PUBLIC_APP_URL="http://your-server-ip:3000"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..." # Required for restoration script
CRON_SECRET="your-secret"
```

### 3.5 Restore Data
Run the included script directly on the server:
```bash
npx tsx scripts/restore.ts /path/to/backup_full_json_....zip
```

### 3.6 Start App
```bash
pm2 start npm --name "bizad-finance" -- start
pm2 save
pm2 startup
```

---

## 4. Platform C: cPanel (Shared Hosting)

### 4.1 Prerequisites
*   Ensure your cPanel supports **"Setup Node.js App"**.
*   Ensure you can select **Node.js 18+**.

### 4.2 Steps
1.  **File Manager**: Upload the code (unzipped) to `public_html` or a subfolder.
2.  **Node.js App**:
    *   Create App.
    *   Application Root: `public_html` (or your folder).
    *   Application URL: Your domain.
    *   Startup File: `node_modules/.bin/next` (or leave blank and try to run `npm start` via script).
3.  **Environment**: Add variables in the cPanel UI or `.env` file.
4.  **Restore**:
    *   Access Terminal in cPanel.
    *   Run `npm install`.
    *   Run `npm run build`.
    *   Run `npx tsx scripts/restore.ts path/to/backup.zip`.

---

## 5. Verification
1.  Log in with your existing credentials.
2.  Go to **Activity Logs** to verify past data exists.
3.  Check **Reports** to ensure calculations are correct.
