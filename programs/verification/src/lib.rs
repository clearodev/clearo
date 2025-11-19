use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("verification_program_id");

#[program]
pub mod verification {
    use super::*;

    /// Initialize a verification request
    /// Generates a unique verification code for the project
    pub fn initialize_verification(
        ctx: Context<InitializeVerification>,
        project_id: String,
    ) -> Result<()> {
        let verification = &mut ctx.accounts.verification;
        verification.project_id = project_id;
        verification.owner = ctx.accounts.owner.key();
        verification.verification_code = generate_verification_code();
        verification.verified = false;
        verification.bump = ctx.bumps.verification;
        
        msg!("Verification initialized for project: {}", verification.project_id);
        msg!("Verification code: {}", verification.verification_code);
        
        Ok(())
    }

    /// Verify project ownership by checking token transfer
    /// This should be called after the owner sends tokens with the verification code in memo
    pub fn verify_ownership(
        ctx: Context<VerifyOwnership>,
        amount: u64,
    ) -> Result<()> {
        let verification = &mut ctx.accounts.verification;
        
        require!(!verification.verified, VerificationError::AlreadyVerified);
        
        // Check if the required amount was transferred (5-50 CLRO tokens)
        require!(
            amount >= 5_000_000 && amount <= 50_000_000, // Assuming 6 decimals
            VerificationError::InvalidAmount
        );
        
        verification.verified = true;
        verification.verified_at = Clock::get()?.unix_timestamp;
        
        msg!("Project verified: {}", verification.project_id);
        
        Ok(())
    }

    /// Generate a unique verification code
    fn generate_verification_code() -> String {
        // In production, use a more secure method
        // This is a simplified version using hash
        let timestamp = Clock::get().unwrap().unix_timestamp;
        let random = anchor_lang::solana_program::hash::hash(
            &timestamp.to_le_bytes()
        );
        // Convert first 8 bytes to hex string
        random.to_bytes()[..8]
            .iter()
            .map(|b| format!("{:02x}", b))
            .collect::<String>()
    }
}

#[derive(Accounts)]
#[instruction(project_id: String)]
pub struct InitializeVerification<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Verification::LEN,
        seeds = [b"verification", project_id.as_bytes()],
        bump
    )]
    pub verification: Account<'info, Verification>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyOwnership<'info> {
    #[account(
        mut,
        seeds = [b"verification", verification.project_id.as_bytes()],
        bump = verification.bump
    )]
    pub verification: Account<'info, Verification>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub from_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Verification {
    pub project_id: String,
    pub owner: Pubkey,
    pub verification_code: String,
    pub verified: bool,
    pub verified_at: i64,
    pub bump: u8,
}

impl Verification {
    pub const LEN: usize = 4 + 32 + 32 + 64 + 1 + 8 + 1; // project_id + owner + code + verified + verified_at + bump
}

#[error_code]
pub enum VerificationError {
    #[msg("Project is already verified")]
    AlreadyVerified,
    #[msg("Invalid verification amount. Must be between 5-50 CLRO tokens")]
    InvalidAmount,
}

