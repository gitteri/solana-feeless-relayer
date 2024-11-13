use anchor_lang::prelude::*;

use crate::{Relayer, Sponsorship};

#[derive(Accounts)]
pub struct AuthorizeRelayer<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = sponsorship)]
    pub relayer: Account<'info, Relayer>,
    #[account(has_one = authority)]
    pub sponsorship: Account<'info, Sponsorship>,
}

pub fn handler(ctx: Context<AuthorizeRelayer>, sponsor_cap: u64) -> Result<()> {
    let relayer = &mut ctx.accounts.relayer;
    relayer.authorized = true;
    relayer.sponsor_cap = sponsor_cap;
    Ok(())
}