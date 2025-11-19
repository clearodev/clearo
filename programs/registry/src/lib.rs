use anchor_lang::prelude::*;

declare_id!("registry_program_id");

#[program]
pub mod registry {
    use super::*;

    /// Register a new project
    pub fn register_project(
        ctx: Context<RegisterProject>,
        name: String,
        description: String,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        project.owner = ctx.accounts.owner.key();
        project.name = name;
        project.description = description;
        project.verified = false;
        project.created_at = Clock::get()?.unix_timestamp;
        project.bump = ctx.bumps.project;
        
        msg!("Project registered: {}", project.name);
        
        Ok(())
    }

    /// Update project metadata
    pub fn update_project(
        ctx: Context<UpdateProject>,
        name: Option<String>,
        description: Option<String>,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        
        require!(
            project.owner == ctx.accounts.owner.key(),
            RegistryError::Unauthorized
        );
        
        if let Some(name) = name {
            project.name = name;
        }
        if let Some(description) = description {
            project.description = description;
        }
        
        project.updated_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }

    /// Add document hash to project
    pub fn add_document(
        ctx: Context<AddDocument>,
        doc_type: DocumentType,
        hash: String,
        url: String,
    ) -> Result<()> {
        let document = &mut ctx.accounts.document;
        document.project = ctx.accounts.project.key();
        document.doc_type = doc_type;
        document.hash = hash;
        document.url = url;
        document.uploaded_at = Clock::get()?.unix_timestamp;
        document.bump = ctx.bumps.document;
        
        msg!("Document added: {:?}", doc_type);
        
        Ok(())
    }

    /// Update verification status (called by verification program)
    pub fn set_verified(
        ctx: Context<SetVerified>,
        verified: bool,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        project.verified = verified;
        
        if verified {
            project.verified_at = Clock::get()?.unix_timestamp;
        }
        
        Ok(())
    }

    /// Update transparency score (called by off-chain indexer)
    pub fn update_score(
        ctx: Context<UpdateScore>,
        score: u8,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        project.transparency_score = score;
        project.score_updated_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String, description: String)]
pub struct RegisterProject<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Project::LEN,
        seeds = [b"project", owner.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub project: Account<'info, Project>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProject<'info> {
    #[account(
        mut,
        seeds = [b"project", project.owner.as_ref(), project.name.as_bytes()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(doc_type: DocumentType, hash: String, url: String)]
pub struct AddDocument<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Document::LEN,
        seeds = [b"document", project.key().as_ref(), hash.as_bytes()],
        bump
    )]
    pub document: Account<'info, Document>,
    
    #[account(
        seeds = [b"project", project.owner.as_ref(), project.name.as_bytes()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetVerified<'info> {
    #[account(
        mut,
        seeds = [b"project", project.owner.as_ref(), project.name.as_bytes()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,
    
    /// Only verification program can call this
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateScore<'info> {
    #[account(
        mut,
        seeds = [b"project", project.owner.as_ref(), project.name.as_bytes()],
        bump = project.bump
    )]
    pub project: Account<'info, Project>,
    
    /// Only scoring authority can call this
    pub authority: Signer<'info>,
}

#[account]
pub struct Project {
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub verified: bool,
    pub verified_at: i64,
    pub transparency_score: u8,
    pub score_updated_at: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl Project {
    pub const LEN: usize = 32 + 64 + 128 + 1 + 8 + 1 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Document {
    pub project: Pubkey,
    pub doc_type: DocumentType,
    pub hash: String,
    pub url: String,
    pub uploaded_at: i64,
    pub bump: u8,
}

impl Document {
    pub const LEN: usize = 32 + 1 + 64 + 256 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub enum DocumentType {
    Whitepaper,
    Roadmap,
    Tokenomics,
    MonthlyReport,
    FinancialTransparency,
    AuditReport,
    TeamIntroduction,
    GitHub,
}

#[error_code]
pub enum RegistryError {
    #[msg("Unauthorized")]
    Unauthorized,
}






