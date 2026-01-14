import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// These should be environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/backup/auth/callback`;

export const driveClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

export function getAuthUrl() {
    return driveClient.generateAuthUrl({
        access_type: 'offline', // Crucial for refresh tokens
        scope: SCOPES,
        prompt: 'consent' // Force refresh token generation
    });
}

export async function getTokens(code: string) {
    const { tokens } = await driveClient.getToken(code);
    return tokens;
}

export function setCredentials(tokens: any) {
    driveClient.setCredentials(tokens);
}

// Ensure we have a dedicated folder
export async function getOrCreateBackupFolder(folderName = 'BizAdFinance Backups', authClient?: any) {
    const drive = google.drive({ version: 'v3', auth: authClient || driveClient });

    // Check if folder exists
    const res = await drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        fields: 'files(id, name)',
    });

    if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id; // Return existing ID
    }

    // Create new folder
    const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    };

    const file = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
    });

    return file.data.id;
}

export async function uploadBackup(
    fileName: string,
    fileStream: Readable,
    mimeType: string,
    description: string,
    authClient?: any
) {
    const drive = google.drive({ version: 'v3', auth: authClient || driveClient });
    const folderId = await getOrCreateBackupFolder('BizAdFinance Backups', authClient);

    const requestBody = {
        name: fileName,
        parents: [folderId!],
        description: description, // Store metadata here effectively
    };

    const media = {
        mimeType: mimeType,
        body: fileStream,
    };

    const response = await drive.files.create({
        requestBody,
        media: media,
        fields: 'id, name, size, webContentLink',
    });

    return response.data;
}

export async function listBackups(limit = 10, authClient?: any) {
    const drive = google.drive({ version: 'v3', auth: authClient || driveClient });
    const folderId = await getOrCreateBackupFolder('BizAdFinance Backups', authClient);

    const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: limit,
        orderBy: 'createdTime desc',
        fields: 'files(id, name, createdTime, size, webContentLink, description, mimeType)',
    });

    return res.data.files || [];
}

export async function deleteBackup(fileId: string, authClient?: any) {
    const drive = google.drive({ version: 'v3', auth: authClient || driveClient });
    await drive.files.delete({ fileId });
}
