use anchor_lang::prelude::*;

use crate::{Relayer, Sponsorship};

#[derive(Accounts)]
pub struct BlockRelayer<'info> {
    #[account()]
    pub authority: Signer<'info>,
    #[account()]
    pub relayer: Account<'info, Relayer>,
    #[account(has_one = authority)]
    pub sponsorship: Account<'info, Sponsorship>,
}

pub fn handler(ctx: Context<BlockRelayer>) -> Result<()> {
    let relayer = &mut ctx.accounts.relayer;
    relayer.authorized = false;
    Ok(())
}
