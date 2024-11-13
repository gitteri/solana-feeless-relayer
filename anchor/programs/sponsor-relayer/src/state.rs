use anchor_lang::prelude::*;

#[account]
#[derive(Default, InitSpace)]
pub struct Sponsorship {
    pub authority: Pubkey,
    pub mint: Option<Pubkey>,
    pub max_priority_fee: u64,
    pub allow_permissionless_relayers: bool,
    pub bump: u8,
    pub fund_rent: bool,
}

#[account]
#[derive(Default, InitSpace)]
pub struct Relayer {
    pub authority: Pubkey,
    pub sponsorship: Pubkey,
    pub relayer_wallet: Pubkey,
    pub sponsor_cap: u64,
    pub authorized: bool,
    pub bump: u8,
}
