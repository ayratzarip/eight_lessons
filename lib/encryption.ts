/**
 * Encryption utilities for logbook entries
 */

// TextEncoder and TextDecoder for working with strings
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Generate a random encryption key
 * @returns {Promise<CryptoKey>} A randomly generated encryption key
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // exportable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey as a base64 string
 * @param {CryptoKey} key - The CryptoKey to export
 * @returns {Promise<string>} Base64 encoded key
 */
export async function exportKeyAsBase64(key: CryptoKey): Promise<string> {
  const rawKey = await window.crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawKey))));
}

/**
 * Import a base64 string as a CryptoKey
 * @param {string} base64Key - Base64 encoded key
 * @returns {Promise<CryptoKey>} Imported CryptoKey
 */
export async function importKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  const binaryKey = atob(base64Key);
  const rawKey = new Uint8Array(binaryKey.length);
  for (let i = 0; i < binaryKey.length; i++) {
    rawKey[i] = binaryKey.charCodeAt(i);
  }
  
  return await window.crypto.subtle.importKey(
    'raw',
    rawKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt the user's master key with their provider token
 * @param {string} masterKey - The user's master key as base64
 * @param {string} token - The token to use for encryption (from OAuth provider)
 * @returns {Promise<string>} Encrypted master key as base64
 */
export async function encryptMasterKey(masterKey: string, token: string): Promise<string> {
  // Use PBKDF2 to derive a key from the token
  const salt = encoder.encode('logbook-encryption-salt');
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(token),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive the actual key
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  // Generate IV (Initialization Vector)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the master key
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    derivedKey,
    encoder.encode(masterKey)
  );
  
  // Combine IV and encrypted data
  const result = new Uint8Array(iv.length + encryptedData.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedData), iv.length);
  
  // Convert to base64
  return btoa(String.fromCharCode.apply(null, Array.from(result)));
}

/**
 * Decrypt the user's master key with their provider token
 * @param {string} encryptedMasterKey - Encrypted master key in format "iv.authTag.encrypted" (all base64)
 * @param {string} token - The token used for encryption (from OAuth provider)
 * @returns {Promise<string>} Decrypted master key as base64
 */
export async function decryptMasterKey(encryptedMasterKey: string, token: string): Promise<string> {
  // Use PBKDF2 to derive a key from the token
  const salt = encoder.encode('logbook-encryption-salt');
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(token),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive the actual key
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  try {
    // Try to decode as server-side format (format: iv.authTag.encrypted)
    const parts = encryptedMasterKey.split('.');
    if (parts.length === 3) {
      const [ivBase64, authTagBase64, encryptedBase64] = parts;
      
      // Convert from base64
      const iv = new Uint8Array(Array.from(atob(ivBase64), c => c.charCodeAt(0)));
      const authTag = new Uint8Array(Array.from(atob(authTagBase64), c => c.charCodeAt(0)));
      const encrypted = new Uint8Array(Array.from(atob(encryptedBase64), c => c.charCodeAt(0)));
      
      // Combine encrypted data and auth tag (for GCM we need to append the auth tag)
      const ciphertext = new Uint8Array(encrypted.length + authTag.length);
      ciphertext.set(encrypted);
      ciphertext.set(authTag, encrypted.length);
      
      // Decrypt the master key
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: 128 // GCM authentication tag is 16 bytes (128 bits)
        },
        derivedKey,
        ciphertext
      );
      
      // Return as string
      return decoder.decode(decryptedData);
    } else {
      // Handle client-side format (IV + encrypted data)
      const binary = atob(encryptedMasterKey);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      // Extract IV (12 bytes) and encrypted data
      const iv = bytes.slice(0, 12);
      const encryptedData = bytes.slice(12);
      
      // Decrypt the data
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        derivedKey,
        encryptedData
      );
      
      return decoder.decode(decryptedData);
    }
  } catch (error) {
    console.error('Error decrypting master key:', error);
    throw new Error('Failed to decrypt master key');
  }
}

/**
 * Encrypt a logbook entry
 * @param {any} data - The data to encrypt
 * @param {CryptoKey} key - The encryption key
 * @returns {Promise<{encryptedData: string, iv: string}>} Encrypted data and IV as base64
 */
export async function encryptData(data: any, key: CryptoKey): Promise<{encryptedData: string, iv: string}> {
  // Convert data to JSON string
  const jsonString = JSON.stringify(data);
  
  // Generate IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the data
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(jsonString)
  );
  
  // Convert to base64
  const encryptedDataBase64 = btoa(
    String.fromCharCode.apply(null, Array.from(new Uint8Array(encryptedData)))
  );
  
  const ivBase64 = btoa(
    String.fromCharCode.apply(null, Array.from(iv))
  );
  
  return {
    encryptedData: encryptedDataBase64,
    iv: ivBase64
  };
}

/**
 * Decrypt a logbook entry
 * @param {string} encryptedDataBase64 - The encrypted data as base64
 * @param {string} ivBase64 - The IV as base64
 * @param {CryptoKey} key - The decryption key
 * @returns {Promise<any>} Decrypted data object
 */
export async function decryptData(encryptedDataBase64: string, ivBase64: string, key: CryptoKey): Promise<any> {
  // Convert from base64
  const encryptedData = new Uint8Array(
    Array.from(atob(encryptedDataBase64), c => c.charCodeAt(0))
  );
  
  const iv = new Uint8Array(
    Array.from(atob(ivBase64), c => c.charCodeAt(0))
  );
  
  // Decrypt the data
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encryptedData
  );
  
  // Parse the JSON
  const jsonString = decoder.decode(decryptedData);
  return JSON.parse(jsonString);
}

// Server-side key generation (for NodeJS environment)
export async function generateServerSideKey(): Promise<string> {
  // This function is for server-side key generation
  // A simple implementation using Node.js crypto
  if (typeof require !== 'undefined') {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('base64');
  }
  
  // Fallback for non-Node environments
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined') {
    window.crypto.getRandomValues(array);
  }
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
}