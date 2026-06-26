import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { ApiError } from '../middleware/errorHandler.js';

const ALGORITHM = 'aes-256-gcm';

const getKey = () => {
  const secret = process.env.SECRET_ENCRYPTION_KEY;

  if (!secret) {
    throw new ApiError(
      500,
      'SECRET_ENCRYPTION_KEY is not configured',
      'ENCRYPTION_KEY_MISSING'
    );
  }

  return createHash('sha256').update(secret).digest();
};

export const encryptSecretValue = (plainText: string) => {
  const key = getKey();
  const iv = randomBytes(12);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
};

export const decryptSecretValue = (encryptedValue: string) => {
  const key = getKey();
  const [ivPart, authTagPart, encryptedPart] = encryptedValue.split('.');

  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new ApiError(
      500,
      'Invalid encrypted secret payload',
      'ENCRYPTION_PAYLOAD_INVALID'
    );
  }

  const iv = Buffer.from(ivPart, 'base64url');
  const authTag = Buffer.from(authTagPart, 'base64url');
  const encrypted = Buffer.from(encryptedPart, 'base64url');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};