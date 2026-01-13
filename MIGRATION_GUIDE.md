# Migration & Restoration Guide

This document provides a step-by-step guide on how to migrate the **Biz Ad Finance** application to a new server, restore backups, and ensure continuous operation.

## 1. Prerequisites
Before migrating, ensure you have the following:
*   **The Full Backup Zip File** (downloaded from Google Drive).
*   A **Virtual Private Server (VPS)** (e.g., DigitalOcean Droplet, AWS EC2, Linode).
    *   OS: Ubuntu 22.04 LTS (Recommended).
    *   RAM: Minimum 2GB.
*   **Domain Name** (Optional but recommended).

---

## 2. Server Setup (Ubuntu 22.04)
Connect to your new server via SSH:
```bash
ssh root@your-server-ip
```

### 2.1 Install Node.js
We need Node.js (v18 or v20) to run the application.
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2.2 Install PostgreSQL
We need a database server.
```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2.3 Configure Database
Create a new user and database for the app.
```bash
sudo -u postgres psql
```
Inside the SQL prompt:
```sql
CREATE DATABASE bizad_finance;
CREATE USER admin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bizad_finance TO admin;
\q
```

---

## 3. Restoring the Application

### 3.1 Upload & Extract Backup
Upload your backup zip file to the server (using SCP, FileZilla, or `wget`).
```bash
# Install unzip if missing
sudo apt-get install unzip

# Create app directory
mkdir -p /var/www/bizad-finance
cd /var/www/bizad-finance

# Extract the backup
unzip /path/to/backup_full_TIMESTAMP.zip
```
You should now see:
*   `codebase.zip`
*   `dump.sql`
*   `manifest.json`

### 3.2 Restore Codebase
```bash
unzip codebase.zip -d app
cd app
npm install
npm run build
```

### 3.3 Restore Database
```bash
# Import the SQL dump into the new database
PGPASSWORD='your_secure_password' psql -U admin -h localhost -d bizad_finance < ../dump.sql
```
*Note: If you have errors about roles not existing, ignore them unless they are critical. The data is what matters.*

---

## 4. Configuration & Launch

### 4.1 Update Environment Variables
Edit the `.env` file to point to your **NEW** local database.
```bash
nano .env
```
Update these lines:
```
DATABASE_URL="postgresql://admin:your_secure_password@localhost:5432/bizad_finance?schema=public"
NEXT_PUBLIC_APP_URL="http://your-server-ip:3000"
```

### 4.2 Start the Application
Use `pm2` to keep the app running in the background.
```bash
sudo npm install -g pm2
pm2 start npm --name "bizad-finance" -- start
pm2 save
pm2 startup
```

Your app is now running at `http://your-server-ip:3000`.

---

## 5. (Optional) Nginx & SSL
To access the app via a domain with HTTPS:

1.  Install Nginx: `sudo apt-get install nginx`
2.  Configure Nginx Proxy to forward port 80 -> 3000.
3.  Use Certbot for SSL: `sudo apt-get install certbot python3-certbot-nginx`

## 6. Verification
1.  Log in with your existing credentials.
2.  Go to **Activity Logs** to verify past data exists.
3.  Check **Reports** to ensure calculations are correct.
