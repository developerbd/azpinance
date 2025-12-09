import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment variable
 * Falls back to a default key for development (NOT SECURE FOR PRODUCTION)
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
        console.warn('⚠️  ENCRYPTION_KEY not set in environment. Using default key (NOT SECURE FOR PRODUCTION)');
        // Default key for development only - MUST be changed in production
        return Buffer.from('default-dev-key-change-in-prod-32', 'utf-8').subarray(0, KEY_LENGTH);
    }

    // Ensure key is exactly 32 bytes
    const keyBuffer = Buffer.from(key, 'utf-8');
    if (keyBuffer.length < KEY_LENGTH) {
        // Pad with zeros if too short
        return Buffer.concat([keyBuffer, Buffer.alloc(KEY_LENGTH - keyBuffer.length)]);
    }
    return keyBuffer.subarray(0, KEY_LENGTH);
}

/**
 * Encrypt a string value
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData (all base64)
 */
export function encrypt(text: string): string {
    if (!text) return '';

    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const authTag = cipher.getAuthTag();

        // Return format: iv:authTag:encryptedData (all base64 encoded)
        return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt an encrypted string
 * @param encryptedText - Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText) return '';

    try {
        const key = getEncryptionKey();
        const parts = encryptedText.split(':');

        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'base64');
        const authTag = Buffer.from(parts[1], 'base64');
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Failed to decrypt data');
    }
}

/**
 * Check if a string is encrypted (has the expected format)
 * @param text - String to check
 * @returns True if the string appears to be encrypted
 */
export function isEncrypted(text: string): boolean {
    if (!text) return false;
    const parts = text.split(':');
    return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Hash a password using SHA-256 (one-way hash)
 * Use this for password verification, not for encryption
 */
export function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generate a random encryption key (32 bytes)
 * Use this to generate ENCRYPTION_KEY for .env.local
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('base64');
}
