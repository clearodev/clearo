/**
 * Utility script to generate verification codes
 * This matches the logic in the Solana program
 */

import * as crypto from 'crypto';
import bs58 from 'bs58';

export function generateVerificationCode(): string {
  const timestamp = Date.now();
  const hash = crypto.createHash('sha256').update(timestamp.toString()).digest();
  return bs58.encode(hash.slice(0, 8));
}

if (require.main === module) {
  console.log('Verification Code:', generateVerificationCode());
}






