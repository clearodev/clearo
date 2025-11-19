use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Burn};

declare_id!("voting_program_id");

#[program]
pub mod voting {
    use super::*;

    /// Cast a vote (upvote or downvote)
    /// Requires burning 1 token per vote
    pub fn vote(
        ctx: Context<Vote>,
        project: Pubkey,
        vote_type: VoteType,
        amount: u64, // Amount of tokens to burn (1 token = 1 vote)
    ) -> Result<()> {
        require!(
            amount >= 1_000_000, // Minimum 1 token (assuming 6 decimals)
            VotingError::InsufficientTokens
        );
        
        let vote = &mut ctx.accounts.vote;
        vote.voter = ctx.accounts.voter.key();
        vote.project = project;
        vote.vote_type = vote_type;
        vote.amount = amount;
        vote.voted_at = Clock::get()?.unix_timestamp;
        vote.bump = ctx.bumps.vote;
        
        // Burn tokens (1 token = 1 vote)
        let burn_amount = amount;
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.voter_token_account.to_account_info(),
            authority: ctx.accounts.voter.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, burn_amount)?;
        
        msg!("Vote cast: {:?} for project {}", vote_type, project);
        msg!("Tokens burned: {}", burn_amount);
        
        Ok(())
    }

    /// Change an existing vote
    pub fn change_vote(
        ctx: Context<ChangeVote>,
        new_vote_type: VoteType,
    ) -> Result<()> {
        let vote = &mut ctx.accounts.vote;
        
        require!(
            vote.voter == ctx.accounts.voter.key(),
            VotingError::Unauthorized
        );
        
        vote.vote_type = new_vote_type;
        vote.updated_at = Clock::get()?.unix_timestamp;
        
        msg!("Vote changed to: {:?}", new_vote_type);
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(project: Pubkey, vote_type: VoteType, amount: u64)]
pub struct Vote<'info> {
    #[account(
        init,
        payer = voter,
        space = 8 + VoteAccount::LEN,
        seeds = [b"vote", voter.key().as_ref(), project.as_ref()],
        bump
    )]
    pub vote: Account<'info, VoteAccount>,
    
    #[account(mut)]
    pub voter: Signer<'info>,
    
    #[account(mut)]
    pub voter_token_account: Account<'info, TokenAccount>,
    
    pub mint: Account<'info, anchor_spl::token::Mint>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ChangeVote<'info> {
    #[account(
        mut,
        seeds = [b"vote", voter.key().as_ref(), vote.project.as_ref()],
        bump = vote.bump
    )]
    pub vote: Account<'info, VoteAccount>,
    
    pub voter: Signer<'info>,
}

#[account]
pub struct VoteAccount {
    pub voter: Pubkey,
    pub project: Pubkey,
    pub vote_type: VoteType,
    pub amount: u64,
    pub voted_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl VoteAccount {
    pub const LEN: usize = 32 + 32 + 1 + 8 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub enum VoteType {
    Upvote,
    Downvote,
}

#[error_code]
pub enum VotingError {
    #[msg("Insufficient tokens for voting")]
    InsufficientTokens,
    #[msg("Unauthorized")]
    Unauthorized,
}






