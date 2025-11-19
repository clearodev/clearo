import { Connection, PublicKey, Transaction, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
export const connection = new Connection(RPC_URL, 'confirmed');

// Memo program ID: MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// CLRO token mint address - should match frontend
const CLRO_TOKEN_MINT = process.env.CLRO_TOKEN_MINT || process.env.SOLANA_CLRO_TOKEN_MINT || '11111111111111111111111111111111';
const VERIFICATION_BURN_AMOUNT = 500_000_000; // 500 CLRO tokens (6 decimals)

/**
 * Verify a transaction with token burn (for project verification)
 * Verifies that:
 * 1. Transaction signature is valid and confirmed
 * 2. Transaction contains token burn instruction for CLRO tokens
 * 3. Burn amount matches expected amount (500 CLRO tokens)
 * 4. Transaction contains memo instruction with the verification code
 * 5. Transaction signer matches the expected owner wallet
 * 
 * This proves wallet ownership because:
 * - Only the wallet owner can sign a transaction
 * - Burning tokens adds economic cost and proves commitment
 */
export async function verifyTokenTransfer(
  signature: string,
  expectedOwnerWallet: string,
  expectedMemo: string
): Promise<boolean> {
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      console.error('Transaction not found:', signature);
      return false;
    }

    // Check if transaction was successful
    if (tx.meta?.err) {
      console.error('Transaction failed:', tx.meta.err);
      return false;
    }

    // Get the fee payer (first signer) - this is the wallet that signed the transaction
    // Try multiple methods to extract the signer address
    let signerAddress: string | null = null;
    
    // Method 1: Use getAccountKeys() for VersionedMessage
    try {
      const accountKeys = tx.transaction.message.getAccountKeys();
      if (accountKeys && accountKeys.staticAccountKeys.length > 0) {
        signerAddress = accountKeys.staticAccountKeys[0].toString();
      }
    } catch (e) {
      // Fallback for older transaction formats
    }
    
    // Method 2: Try staticAccountKeys directly (fallback)
    if (!signerAddress && 'staticAccountKeys' in tx.transaction.message && tx.transaction.message.staticAccountKeys && tx.transaction.message.staticAccountKeys.length > 0) {
      signerAddress = tx.transaction.message.staticAccountKeys[0].toString();
    }
    
    // Method 3: Try to get from transaction signatures
    if (!signerAddress && tx.transaction.signatures && tx.transaction.signatures.length > 0) {
      // The first signature corresponds to the fee payer
      // We can't directly get the pubkey from signature, but we can verify it matches
      // For now, we'll rely on the accountKeys method
    }
    
    if (!signerAddress) {
      try {
        const accountKeys = tx.transaction.message.getAccountKeys();
        console.error('Unable to extract signer address from transaction. StaticAccountKeys:', accountKeys?.staticAccountKeys?.length);
      } catch (e) {
        console.error('Unable to extract signer address from transaction');
      }
      return false;
    }

    // Verify signer matches expected owner wallet
    console.log('Verifying signer:', {
      signerAddress,
      expectedOwnerWallet,
      match: signerAddress === expectedOwnerWallet
    });
    
    if (signerAddress !== expectedOwnerWallet) {
      console.error(`Signer mismatch: expected ${expectedOwnerWallet}, got ${signerAddress}`);
      console.error('This means the wallet that signed the transaction does not match the project owner wallet in the database.');
      return false;
    }

    // Check for token burn instruction
    // Warn if CLRO_TOKEN_MINT is still placeholder
    if (CLRO_TOKEN_MINT === '11111111111111111111111111111111') {
      console.warn('WARNING: CLRO_TOKEN_MINT is still set to placeholder. Please set CLRO_TOKEN_MINT environment variable.');
    }
    
    const clroMint = new PublicKey(CLRO_TOKEN_MINT);
    let burnFound = false;
    let burnAmount = BigInt(0);
    const message = tx.transaction.message;

    // Helper function to get PublicKey from account key (handles different formats)
    const getPubkeyFromAccountKey = (accountKey: any): PublicKey | null => {
      if (accountKey instanceof PublicKey) {
        return accountKey;
      }
      if (accountKey && typeof accountKey === 'object' && 'pubkey' in accountKey) {
        return accountKey.pubkey instanceof PublicKey ? accountKey.pubkey : null;
      }
      return null;
    };

    // Get account keys using getAccountKeys() method
    const accountKeys = message.getAccountKeys();
    
    // Check for burn instruction in compiled instructions
    if (message.compiledInstructions) {
      for (let i = 0; i < message.compiledInstructions.length; i++) {
        const compiledIx = message.compiledInstructions[i];
        const programIdIndex = compiledIx.programIdIndex;
        const programIdKey = accountKeys.get(programIdIndex);
        const programId = programIdKey ? programIdKey : null;

        if (programId && programId.equals(TOKEN_PROGRAM_ID)) {
          // This is a token program instruction
          // Check if it's a burn instruction (instruction discriminator is 8 for burn)
          // Burn instruction format: [instruction_discriminator(1 byte), amount(8 bytes)]
          if (compiledIx.data && compiledIx.data.length >= 9) {
            const instructionType = compiledIx.data[0];
            // Token program burn instruction is type 8
            if (instructionType === 8) {
              // Extract amount (next 8 bytes, little-endian)
              const amountBytes = Buffer.from(compiledIx.data.slice(1, 9));
              const amount = BigInt(
                amountBytes.readUInt32LE(0) +
                (Number(amountBytes.readUInt32LE(4)) * Number(0x100000000))
              );
              
              // Check if the mint account matches CLRO token
              // In burn instruction: [0] = account (token account), [1] = mint, [2] = authority
              if (compiledIx.accountKeyIndexes && compiledIx.accountKeyIndexes.length >= 2) {
                const mintIndex = compiledIx.accountKeyIndexes[1];
                const mintKey = accountKeys.get(mintIndex);
                const mintPubkey = mintKey || null;
                
                if (mintPubkey && mintPubkey.equals(clroMint)) {
                  burnFound = true;
                  burnAmount = amount;
                  console.log(`Found CLRO burn: ${amount} tokens`);
                  break;
                }
              }
            }
          }
        }
      }
    }

    // Also check parsed instructions for burn (if available)
    if (!burnFound && 'instructions' in message && message.instructions) {
      for (const instruction of message.instructions) {
        if ('programId' in instruction) {
          const programId = getPubkeyFromAccountKey(instruction.programId);
          if (programId && programId.equals(TOKEN_PROGRAM_ID)) {
            // Check if this is a burn instruction
            if ('parsed' in instruction && instruction.parsed && typeof instruction.parsed === 'object' && 'type' in instruction.parsed && instruction.parsed.type === 'burn') {
              const parsed = instruction.parsed as any;
              const mintAddress = parsed.info?.mint || parsed.info?.tokenAmount?.mint;
              if (mintAddress === clroMint.toString()) {
                burnFound = true;
                burnAmount = BigInt(parsed.info.tokenAmount?.amount || parsed.info.amount || 0);
                console.log(`Found CLRO burn in parsed instructions: ${burnAmount} tokens`);
                break;
              }
            }
          }
        }
      }
    }

    // Check inner instructions (for wrapped transactions)
    if (!burnFound && tx.meta?.innerInstructions) {
      for (const innerIx of tx.meta.innerInstructions) {
        for (const instruction of innerIx.instructions) {
          if ('programId' in instruction) {
            const programId = getPubkeyFromAccountKey(instruction.programId);
            if (programId && programId.equals(TOKEN_PROGRAM_ID)) {
              if ('parsed' in instruction && instruction.parsed && typeof instruction.parsed === 'object' && 'type' in instruction.parsed && instruction.parsed.type === 'burn') {
                const parsed = instruction.parsed as any;
                const mintAddress = parsed.info?.mint || parsed.info?.tokenAmount?.mint;
                if (mintAddress === clroMint.toString()) {
                  burnFound = true;
                  burnAmount = BigInt(parsed.info.tokenAmount?.amount || parsed.info.amount || 0);
                  console.log(`Found CLRO burn in inner instructions: ${burnAmount} tokens`);
                  break;
                }
              }
            }
          }
        }
        if (burnFound) break;
      }
    }

    // Debug: Log transaction structure if burn not found
    if (!burnFound) {
      console.log('Burn not found. Transaction structure:');
      console.log('- Compiled instructions:', message.compiledInstructions?.length || 0);
      console.log('- Parsed instructions:', ('instructions' in message && message.instructions) ? message.instructions.length : 0);
      console.log('- Inner instructions:', tx.meta?.innerInstructions?.length || 0);
      console.log('- CLRO mint address:', clroMint.toString());
      console.log('- Token program ID:', TOKEN_PROGRAM_ID.toString());
      
      // Log all token program instructions for debugging
      if (message.compiledInstructions) {
        message.compiledInstructions.forEach((ix, idx) => {
          const programIdKey = accountKeys.get(ix.programIdIndex);
          const programId = programIdKey || null;
          if (programId && programId.equals(TOKEN_PROGRAM_ID)) {
            const instructionType = ix.data?.[0];
            const instructionName = instructionType === 8 ? 'BURN' : instructionType === 3 ? 'TRANSFER' : `TYPE_${instructionType}`;
            const accountKeysList = ix.accountKeyIndexes?.map((idx: number) => {
              const key = accountKeys.get(idx);
              return key ? key.toString() : 'unknown';
            }) || [];
            console.log(`Token instruction ${idx} (${instructionName}):`, {
              type: instructionType,
              accounts: accountKeysList,
              accountCount: ix.accountKeyIndexes?.length,
              dataLength: ix.data?.length,
              // If it's a burn (type 8) and has mint account, show it
              mintAddress: instructionType === 8 && accountKeysList.length >= 2 ? accountKeysList[1] : 'N/A'
            });
          }
        });
      }
      
      // Also check parsed instructions for mint addresses
      if ('instructions' in message && message.instructions) {
        message.instructions.forEach((ix: any, idx: number) => {
          if ('programId' in ix) {
            const programId = getPubkeyFromAccountKey(ix.programId);
            if (programId && programId.equals(TOKEN_PROGRAM_ID)) {
              if ('parsed' in ix && ix.parsed) {
                const parsed = ix.parsed;
                console.log(`Parsed token instruction ${idx}:`, {
                  type: parsed.type,
                  mint: parsed.info?.mint || parsed.info?.tokenAmount?.mint || 'N/A',
                  amount: parsed.info?.tokenAmount?.amount || parsed.info?.amount || 'N/A'
                });
              }
            }
          }
        });
      }
    }

    if (!burnFound) {
      console.error('Token burn instruction not found in transaction');
      return false;
    }

    // Verify burn amount matches expected amount (500 CLRO tokens)
    if (burnAmount < BigInt(VERIFICATION_BURN_AMOUNT)) {
      console.error(`Insufficient burn amount: expected at least ${VERIFICATION_BURN_AMOUNT}, got ${burnAmount}`);
      return false;
    }

    // Check for memo instruction with verification code
    // Memo program stores UTF-8 data directly in the instruction data
    let memoFound = false;
    const foundMemos: string[] = []; // For debugging

    // Get account keys for memo checking
    const memoAccountKeys = message.getAccountKeys();
    
    // Method 1: Check compiled instructions (most reliable for memo program)
    if (message.compiledInstructions) {
      for (let i = 0; i < message.compiledInstructions.length; i++) {
        const compiledIx = message.compiledInstructions[i];
        const programIdIndex = compiledIx.programIdIndex;
        const programIdKey = memoAccountKeys.get(programIdIndex);
        const programId = programIdKey || null;

        if (programId && programId.equals(MEMO_PROGRAM_ID)) {
          try {
            // Memo data is stored as UTF-8 string directly in the instruction data
            // compiledIx.data is a Uint8Array, convert to Buffer
            const dataBuffer = Buffer.from(compiledIx.data);
            const memoData = dataBuffer.toString('utf-8');
            foundMemos.push(memoData);
            
            if (memoData === expectedMemo) {
              memoFound = true;
              console.log(`Found matching memo: ${memoData}`);
              break;
            }
          } catch (e) {
            console.warn('Error decoding memo from compiled instruction:', e);
          }
        }
      }
    }

    // Method 2: Check parsed instructions (if available)
    if (!memoFound && 'instructions' in message && message.instructions) {
      for (const instruction of message.instructions) {
        if ('programId' in instruction) {
          const programId = getPubkeyFromAccountKey(instruction.programId);
          
          if (programId && programId.equals(MEMO_PROGRAM_ID)) {
            // Try to extract memo from parsed instruction
            if ('data' in instruction && instruction.data) {
              try {
                // Data might be base64 encoded or raw
                let memoData: string;
                if (typeof instruction.data === 'string') {
                  // Try base64 decode first
                  try {
                    memoData = Buffer.from(instruction.data, 'base64').toString('utf-8');
                  } catch {
                    // If not base64, treat as UTF-8 directly
                    memoData = instruction.data;
                  }
                } else if (instruction.data && typeof instruction.data === 'object') {
                  try {
                    const dataAsAny = instruction.data as any;
                    const isUint8Array = dataAsAny instanceof Uint8Array;
                    const isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(dataAsAny);
                    if (isUint8Array || isBuffer) {
                      memoData = Buffer.from(dataAsAny).toString('utf-8');
                    } else {
                      memoData = String(instruction.data);
                    }
                  } catch {
                    memoData = String(instruction.data);
                  }
                } else {
                  memoData = String(instruction.data || '');
                }
                
                if (memoData) {
                  foundMemos.push(memoData);
                }
                
                if (memoData === expectedMemo) {
                  memoFound = true;
                  console.log(`Found matching memo in parsed instructions: ${memoData}`);
                  break;
                }
              } catch (e) {
                console.warn('Error decoding memo from parsed instruction:', e);
              }
            }
            
            // Also check parsed format
            if ('parsed' in instruction && instruction.parsed) {
              const parsed = instruction.parsed as any;
              if (parsed === expectedMemo || parsed.memo === expectedMemo) {
                memoFound = true;
                console.log(`Found matching memo in parsed format: ${parsed}`);
                break;
              }
            }
          }
        }
      }
    }

    // Method 3: Check inner instructions (for wrapped transactions)
    if (!memoFound && tx.meta?.innerInstructions) {
      for (const innerIx of tx.meta.innerInstructions) {
        for (const instruction of innerIx.instructions) {
          if ('programId' in instruction) {
            const programId = getPubkeyFromAccountKey(instruction.programId);
            if (programId && programId.equals(MEMO_PROGRAM_ID)) {
              if ('data' in instruction && instruction.data) {
                try {
                  const memoData = typeof instruction.data === 'string'
                    ? Buffer.from(instruction.data, 'base64').toString('utf-8')
                    : Buffer.from(instruction.data).toString('utf-8');
                  foundMemos.push(memoData);
                  if (memoData === expectedMemo) {
                    memoFound = true;
                    console.log(`Found matching memo in inner instructions: ${memoData}`);
                    break;
                  }
                } catch (e) {
                  // Continue checking
                }
              }
            }
          }
        }
        if (memoFound) break;
      }
    }

    if (!memoFound) {
      console.error('Memo with verification code not found in transaction');
      console.error('Expected memo:', expectedMemo);
      console.error('Found memos:', foundMemos);
      console.error('Signer address:', signerAddress);
      console.error('Expected owner wallet:', expectedOwnerWallet);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
}

/**
 * Verify a vote transaction with token burn
 * Verifies that:
 * 1. Transaction signature is valid and confirmed
 * 2. Transaction contains token burn instruction for CLRO tokens
 * 3. Burn amount matches expected amount (10 CLRO tokens)
 * 4. Transaction signer matches the voter wallet
 */
export async function verifyVoteBurn(
  signature: string,
  expectedVoterWallet: string,
  expectedAmount: number
): Promise<boolean> {
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      console.error('Transaction not found:', signature);
      return false;
    }

    // Check if transaction was successful
    if (tx.meta?.err) {
      console.error('Transaction failed:', tx.meta.err);
      return false;
    }

    // Get the fee payer (signer)
    let signerAddress: string | null = null;
    
    try {
      const accountKeys = tx.transaction.message.getAccountKeys();
      if (accountKeys && accountKeys.staticAccountKeys.length > 0) {
        signerAddress = accountKeys.staticAccountKeys[0].toString();
      }
    } catch (e) {
      // Fallback for older transaction formats
      if ('staticAccountKeys' in tx.transaction.message && tx.transaction.message.staticAccountKeys && tx.transaction.message.staticAccountKeys.length > 0) {
        signerAddress = tx.transaction.message.staticAccountKeys[0].toString();
      }
    }
    
    if (!signerAddress && tx.transaction.message.staticAccountKeys && tx.transaction.message.staticAccountKeys.length > 0) {
      signerAddress = tx.transaction.message.staticAccountKeys[0].toString();
    }
    
    if (!signerAddress) {
      console.error('Unable to extract signer address from vote transaction');
      return false;
    }

    // Verify signer matches expected voter wallet
    if (signerAddress !== expectedVoterWallet) {
      console.error(`Vote signer mismatch: expected ${expectedVoterWallet}, got ${signerAddress}`);
      return false;
    }

    // Check for token burn instruction
    const clroMint = new PublicKey(CLRO_TOKEN_MINT);
    let burnFound = false;
    let burnAmount = BigInt(0);
    const message = tx.transaction.message;

    const getPubkeyFromAccountKey = (accountKey: any): PublicKey | null => {
      if (accountKey instanceof PublicKey) {
        return accountKey;
      }
      if (accountKey && typeof accountKey === 'object' && 'pubkey' in accountKey) {
        return accountKey.pubkey instanceof PublicKey ? accountKey.pubkey : null;
      }
      return null;
    };

    // Get account keys for vote checking
    const voteAccountKeys = message.getAccountKeys();
    
    // Check compiled instructions
    if (message.compiledInstructions) {
      for (let i = 0; i < message.compiledInstructions.length; i++) {
        const compiledIx = message.compiledInstructions[i];
        const programIdIndex = compiledIx.programIdIndex;
        const programIdKey = voteAccountKeys.get(programIdIndex);
        const programId = programIdKey || null;

        if (programId && programId.equals(TOKEN_PROGRAM_ID)) {
          if (compiledIx.data && compiledIx.data.length >= 9) {
            const instructionType = compiledIx.data[0];
            if (instructionType === 8) { // Burn instruction
              const amountBytes = Buffer.from(compiledIx.data.slice(1, 9));
              const amount = BigInt(
                amountBytes.readUInt32LE(0) +
                (Number(amountBytes.readUInt32LE(4)) * Number(0x100000000))
              );
              
              if (compiledIx.accountKeyIndexes && compiledIx.accountKeyIndexes.length >= 2) {
                const mintIndex = compiledIx.accountKeyIndexes[1];
                const mintKey = voteAccountKeys.get(mintIndex);
                const mintPubkey = mintKey || null;
                
                if (mintPubkey && mintPubkey.equals(clroMint)) {
                  burnFound = true;
                  burnAmount = amount;
                  break;
                }
              }
            }
          }
        }
      }
    }

    // Check parsed instructions
    if (!burnFound && 'instructions' in message && message.instructions) {
      for (const instruction of message.instructions) {
        if ('programId' in instruction) {
          const programId = getPubkeyFromAccountKey(instruction.programId);
          if (programId && programId.equals(TOKEN_PROGRAM_ID)) {
            if ('parsed' in instruction && instruction.parsed && typeof instruction.parsed === 'object' && 'type' in instruction.parsed && instruction.parsed.type === 'burn') {
              const parsed = instruction.parsed as any;
              const mintAddress = parsed.info?.mint || parsed.info?.tokenAmount?.mint;
              if (mintAddress === clroMint.toString()) {
                burnFound = true;
                burnAmount = BigInt(parsed.info.tokenAmount?.amount || parsed.info.amount || 0);
                break;
              }
            }
          }
        }
      }
    }

    if (!burnFound) {
      console.error('Token burn instruction not found in vote transaction');
      return false;
    }

    // Verify burn amount matches expected amount
    if (burnAmount < BigInt(expectedAmount)) {
      console.error(`Insufficient burn amount for vote: expected at least ${expectedAmount}, got ${burnAmount}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying vote transaction:', error);
    return false;
  }
}

/**
 * Get verification address for a project
 */
export function getVerificationAddress(projectId: string): PublicKey {
  // In production, derive PDA from verification program
  // This is a placeholder
  return PublicKey.default;
}


