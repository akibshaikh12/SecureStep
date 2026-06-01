const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

function deriveKey(userId) {
  const secret =
    process.env.VAULT_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'securestep-vault-dev-key';
  return crypto.scryptSync(`${secret}:vault:${userId}`, 'securestep-evidence-vault', KEY_LENGTH);
}

function encryptPayload(userId, plaintext) {
  const key = deriveKey(userId);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

function decryptPayload(userId, vault) {
  if (!vault?.ciphertext || !vault?.iv || !vault?.authTag) {
    throw new Error('Invalid vault payload');
  }
  const key = deriveKey(userId);
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(vault.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(vault.authTag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(vault.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

module.exports = { encryptPayload, decryptPayload };
