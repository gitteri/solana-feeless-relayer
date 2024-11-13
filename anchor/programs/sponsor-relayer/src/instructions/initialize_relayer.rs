use anchor_lang::prelude::*;

use crate::{Relayer, Sponsorship};

#[derive(Accounts)]
pub struct InitializeRelayer<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = 8 + Relayer::INIT_SPACE, seeds = [b"relayer", relayer_wallet.key().as_ref()], bump)]
    pub relayer: Account<'info, Relayer>,
    pub sponsorship: Account<'info, Sponsorship>,
    /// CHECK: arbitrary relayer wallet
    pub relayer_wallet: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeRelayer>) -> Result<()> {
    let relayer = &mut ctx.accounts.relayer;
    relayer.relayer_wallet = ctx.accounts.relayer_wallet.key();
    relayer.authority = ctx.accounts.authority.key();
    relayer.sponsorship = ctx.accounts.sponsorship.key();
    relayer.sponsor_cap = 0;
    relayer.authorized = ctx.accounts.sponsorship.allow_permissionless_relayers;
    relayer.bump = ctx.bumps.relayer;
    Ok(())
}
