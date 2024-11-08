use anchor_lang::prelude::*;

declare_id!("5Gdnpj8THruSLpvAmP4x9V2YThPT633BiBa9vHvGyXBz");

pub mod error;
pub mod instructions;
pub mod state;

pub use error::*;
pub use instructions::*;
pub use state::*;

#[program]
pub mod sponsor_relayer {
    use super::*;

    pub fn initialize_sponsorship(ctx: Context<InitializeSponsorship>, max_priority_fee: u64, allow_permissionless_relayers: bool, mint: Option<Pubkey>, sponsor_amount: u64, fund_rent: bool) -> Result<()> {
        instructions::initialize_sponsorship::handler(ctx, max_priority_fee, allow_permissionless_relayers, mint, sponsor_amount, fund_rent)
    }

    pub fn relay<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, Relay<'info>>) -> Result<()> {
        instructions::relay::handler(ctx)
    }

    pub fn initialize_relayer(ctx: Context<InitializeRelayer>) -> Result<()> {
        instructions::initialize_relayer::handler(ctx)
    }

    pub fn authorize_relayer(ctx: Context<AuthorizeRelayer>, sponsor_cap: u64) -> Result<()> {
        instructions::authorize_relayer::handler(ctx, sponsor_cap)
    }

    pub fn close_sponsorship(ctx: Context<CloseSponsorship>) -> Result<()> {
        instructions::close_sponsorship::handler(ctx)
    }

    pub fn close_relayer(ctx: Context<CloseRelayer>) -> Result<()> {
        instructions::close_relayer::handler(ctx)
    }

    pub fn block_relayer(ctx: Context<BlockRelayer>) -> Result<()> {
        instructions::block_relayer::handler(ctx)
    }


}

#[derive(Accounts)]
pub struct Initialize {}
