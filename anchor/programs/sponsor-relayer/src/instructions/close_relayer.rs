use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseRelayer<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<CloseRelayer>) -> Result<()> {
    Ok(())
}