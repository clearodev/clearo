import { PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import { pool } from '../db';
import jwt from 'jsonwebtoken';

/**
 * Verify a signed message from a Solana wallet
 * Solana wallets sign messages in a specific format with a prefix
 */
/**
 * Create the message format that Solana wallets sign
 * Format: "\xffSolana Signed Message:\n" + <message_length> + <message_bytes>
 */
function createSolanaSignedMessage(message: string): Uint8Array {
  const messageBytes = new TextEncoder().encode(message);
  const prefix = new TextEncoder().encode('\xffSolana Signed Message:\n');
  
  // Encode message length as compact-u16 (variable-length encoding)
  // Least significant byte first, each byte uses 7 bits, MSB is continuation flag
  const lengthBytes: number[] = [];
  let length = messageBytes.length;
  
  do {
    let byte = length & 0x7f;
    length = length >> 7;
    if (length > 0) {
      byte |= 0x80; // Set continuation bit
    }
    lengthBytes.push(byte);
  } while (length > 0);
  
  // Combine prefix + length + message
  const signedMessage = new Uint8Array(
    prefix.length + lengthBytes.length + messageBytes.length
  );
  signedMessage.set(prefix, 0);
  signedMessage.set(new Uint8Array(lengthBytes), prefix.length);
  signedMessage.set(messageBytes, prefix.length + lengthBytes.length);
  
  return signedMessage;
}

export function verifyWalletSignature(
  message: string,
  signature: string,
  walletAddress: string
): boolean {
  try {
    // Convert signature from base58 to Uint8Array
    let signatureBytes: Uint8Array;
    try {
      const decoded = bs58.decode(signature);
      // bs58.decode returns a Buffer/Uint8Array, ensure it's Uint8Array
      signatureBytes = Uint8Array.from(decoded);
    } catch (decodeError) {
      console.error('Base58 decode failed:', decodeError);
      // If base58 decode fails, try as hex
      if (signature.startsWith('0x')) {
        signatureBytes = Uint8Array.from(Buffer.from(signature.slice(2), 'hex'));
      } else {
        signatureBytes = Uint8Array.from(Buffer.from(signature, 'hex'));
      }
      console.log(`Decoded as hex: ${signatureBytes.length} bytes`);
    }

    // Ed25519 signatures must be exactly 64 bytes
    if (signatureBytes.length !== 64) {
      console.error(`Invalid signature size: ${signatureBytes.length} bytes (expected 64)`);
      console.error(`Signature (first 50 chars): ${signature.substring(0, 50)}`);
      return false;
    }

    // Convert wallet address to PublicKey
    const publicKey = new PublicKey(walletAddress);
    
    // Most Solana wallet adapters sign the raw message directly
    // Try raw message first (most common case)
    const rawMessageBytes = new TextEncoder().encode(message);
    let isValid = nacl.sign.detached.verify(rawMessageBytes, signatureBytes, publicKey.toBytes());
    
    // If that fails, try with Solana signed message format (with prefix) as fallback
    // Some wallets may use the standard Solana message format
    if (!isValid) {
      const signedMessage = createSolanaSignedMessage(message);
      isValid = nacl.sign.detached.verify(signedMessage, signatureBytes, publicKey.toBytes());
    }
    
    if (!isValid) {
      console.error('Signature verification failed with both raw and prefixed message formats');
      console.error('Message length:', message.length);
    }
    
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return false;
  }
}

/**
 * Generate a nonce for wallet authentication
 */
export function generateAuthMessage(walletAddress: string): string {
  const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();
  return `Sign this message to authenticate with Clearo.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
}

/**
 * Authenticate wallet and create/update profile
 */
export async function authenticateWallet(
  walletAddress: string,
  signature: string,
  message: string
): Promise<{ token: string; profile: any }> {
  // Verify signature
  const isValid = verifyWalletSignature(message, signature, walletAddress);
  if (!isValid) {
    console.error('Signature verification failed', {
      walletAddress,
      messageLength: message.length,
      signatureLength: signature.length,
      messagePreview: message.substring(0, 50),
      signaturePreview: signature.substring(0, 30),
    });
    throw new Error('Invalid signature. Please ensure you signed the correct message.');
  }

  // Get or create wallet profile
  let profileResult = await pool.query(
    'SELECT * FROM wallet_profiles WHERE wallet_address = $1',
    [walletAddress]
  );

  let profile;
  if (profileResult.rows.length === 0) {
    // Create new profile
    const insertResult = await pool.query(
      `INSERT INTO wallet_profiles (wallet_address) 
       VALUES ($1) 
       RETURNING *`,
      [walletAddress]
    );
    profile = insertResult.rows[0];
  } else {
    profile = profileResult.rows[0];
  }

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  const jwtExpiration: string | number = process.env.JWT_EXPIRATION || '30d';
  const token = jwt.sign(
    { walletAddress },
    jwtSecret,
    { expiresIn: jwtExpiration } as jwt.SignOptions
  );

  return {
    token,
    profile: {
      walletAddress: profile.wallet_address,
      username: profile.username,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
    },
  };
}

