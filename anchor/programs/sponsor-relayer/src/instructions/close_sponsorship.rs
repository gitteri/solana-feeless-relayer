use anchor_lang::prelude::*;

use crate::Sponsorship;

#[derive(Accounts)]
pub struct CloseSponsorship<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(has_one = authority)]
    pub sponsorship: Account<'info, Sponsorship>,
}

pub fn handler(ctx: Context<CloseSponsorship>) -> Result<()> {
    Ok(())
}