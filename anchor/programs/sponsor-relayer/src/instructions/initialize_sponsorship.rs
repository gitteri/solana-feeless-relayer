use anchor_lang::{prelude::*,  system_program::{self, Transfer}};

use crate::Sponsorship;

#[derive(Accounts)]
pub struct InitializeSponsorship<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = 8 + Sponsorship::INIT_SPACE, seeds = [b"sponsorship", authority.key().as_ref()], bump)]
    pub sponsorship: Account<'info, Sponsorship>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeSponsorship>, max_priority_fee: u64, allow_permissionless_relayers: bool, mint: Option<Pubkey>, sponsor_amount: u64, fund_rent: bool) -> Result<()> {
    let sponsorship = &mut ctx.accounts.sponsorship;
    sponsorship.authority = *ctx.accounts.authority.key;
    sponsorship.max_priority_fee = max_priority_fee;
    sponsorship.allow_permissionless_relayers = allow_permissionless_relayers;
    sponsorship.bump = ctx.bumps.sponsorship;
    sponsorship.mint = mint;
    sponsorship.fund_rent = fund_rent;

    let cpi_accounts = Transfer {
        from: ctx.accounts.authority.to_account_info(),
        to: ctx.accounts.sponsorship.to_account_info(),
    };
    let cpi_program = ctx.accounts.system_program.to_account_info();

    let cpi_context: CpiContext<'_, '_, '_, '_, Transfer<'_>> =
        CpiContext::new(cpi_program, cpi_accounts);

    system_program::transfer(cpi_context, sponsor_amount)?; 

    Ok(())
}
