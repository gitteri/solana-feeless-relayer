use anchor_lang::system_program;
use anchor_lang::{prelude::*, solana_program::rent};
use anchor_lang::solana_program::sysvar::instructions as tx_instructions;
use anchor_spl::token::spl_token;
use anchor_spl::{associated_token, token, token_interface};
use anchor_spl::token_interface::TokenInterface;

use crate::{Relayer, SponsorRelayerError, Sponsorship};

const TRANSFER_CHECKED_DISCRIMINATOR: u8 = 12;
const INITIALIZE_ACCOUNT_2_DISCRIMINATOR: u8 = 16;
const INITIALIZE_ACCOUNT_3_DISCRIMINATOR: u8 = 18;
const SET_AUTHORITY_DISCRIMINATOR: u8 = 6;

const ATA_CREATE_DISCRIMINATOR: u8 = 0;
const ATA_CREATE_IDEMPOTENT_DISCRIMINATOR: u8 = 1;

const SYSTEM_PROGRAM_CREATE_ACCOUNT_DISCRIMINATOR: u8 = 0;

const CLOSE_AUTHORITY_TYPE: u8 = 3;
const ACCOUNT_OWNER_AUTHORITY_TYPE: u8 = 2;

pub mod compute_budget {
    use anchor_lang::declare_id;

    pub const COMPUTE_LIMIT_DISCRIMINATOR: u8 = 2;
    pub const COMPUTE_PRICE_DISCRIMINATOR: u8 = 3;
    declare_id!("ComputeBudget111111111111111111111111111111");
}

pub mod memo {
    use anchor_lang::declare_id;
    declare_id!("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
}

#[derive(Accounts)]
pub struct Relay<'info> {
    #[account(mut)]
    pub relayer_wallet: Signer<'info>,
    #[account(has_one = relayer_wallet, has_one = sponsorship)]
    pub relayer: Account<'info, Relayer>,
    #[account(mut)]
    pub sponsorship: Account<'info, Sponsorship>,
    /// CHECK: instructions sysvar
    #[account(address = tx_instructions::ID)]
    pub instructions: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handler<'a, 'b, 'c, 'info>(ctx: Context<'a, 'b, 'c, 'info, Relay<'info>>) -> Result<()> {
    let mut index = 0;
    let mut signers = vec![];
    let mut compute_limit = 0;
    let mut compute_price = 0;
    let mut create_accounts = vec![];
    let mut init_accounts = vec![];
    let mut rent : u64 = 0;
    let mut current_program: bool = false;

    while let Ok(instr) = tx_instructions::load_instruction_at_checked(index, &ctx.accounts.instructions) {

        instr.accounts.iter().for_each(|account| if account.is_signer {
            if !signers.contains(&account.pubkey) {
                signers.push(account.pubkey);
            }
        });

        
            // two ways to create token accounts
            // 1. create_associated_token_account
            //    - this does everything from transfer lamports, to allocating space, to initializing the account in a single instruction
            //    - however it allocates directly to owner, so we cant set CA without their signature
            // 2. create_account + initialize_account + set owner
            //    - this requires three instructions, we need to track those individually
            //    - benefit of not requiring owner signature to set CA
            // lastly, we need to check for close authority

        if instr.program_id == compute_budget::id() {
            if instr.data[0] == compute_budget::COMPUTE_LIMIT_DISCRIMINATOR {
                compute_limit = u64::from_le_bytes(instr.data[1..].try_into().unwrap());
            } else if instr.data[0] == compute_budget::COMPUTE_PRICE_DISCRIMINATOR {
                compute_price = u64::from_le_bytes(instr.data[1..].try_into().unwrap());
            }
        } else if instr.program_id == crate::id() {
            //curr prog, check its a single call, otherwise relayers could call multiple times and get reimbursed multiple times in a single tx
            require!(current_program == false, SponsorRelayerError::MultipleCalls);
            current_program = true;
        } else if ctx.accounts.sponsorship.fund_rent && instr.program_id == system_program::ID {
            //system program, lets check for create account
            if instr.data[0] == SYSTEM_PROGRAM_CREATE_ACCOUNT_DISCRIMINATOR {
                create_accounts.push(instr.accounts[1].pubkey);
            }
        } else if instr.program_id == anchor_spl::token::ID || instr.program_id == anchor_spl::token_2022::ID {
            //spl token
            // check if it's a transfer
            if instr.data[0] == TRANSFER_CHECKED_DISCRIMINATOR {
                if let Some(mint) = ctx.accounts.sponsorship.mint {
                    require!(instr.accounts[1].pubkey == mint, SponsorRelayerError::InvalidMint);
                }
            // check if its a initialize account instruction
            } else if ctx.accounts.sponsorship.fund_rent && (instr.data[0] == INITIALIZE_ACCOUNT_2_DISCRIMINATOR || instr.data[0] == INITIALIZE_ACCOUNT_3_DISCRIMINATOR) {
                if let Some(idx) = create_accounts.iter().position(|x| x == &instr.accounts[0].pubkey) {
                    let acc = create_accounts.remove(idx);
                } else {
                    return Err(SponsorRelayerError::AttemptedToInitializeExistingAccount.into());
                }

                if let Some(mint) = ctx.accounts.sponsorship.mint {
                    require!(instr.accounts[1].pubkey == mint, SponsorRelayerError::InvalidMint);
                }
                
                let mint = ctx.remaining_accounts.iter().find(|x| x.key == &instr.accounts[1].pubkey).unwrap();
                let accs = token_interface::GetAccountDataSize {mint: mint.clone()};
                let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), accs);

                let res = token_interface::get_account_data_size(cpi_ctx, &[])?;

                rent += Rent::get()?.minimum_balance(res as usize);

                init_accounts.push(instr.accounts[0].pubkey);

            // check if its a set close authority instruction
            } else if ctx.accounts.sponsorship.fund_rent && instr.data[0] == SET_AUTHORITY_DISCRIMINATOR {
                if instr.data[1] == CLOSE_AUTHORITY_TYPE {
                    require!(instr.data[3..] == ctx.accounts.relayer_wallet.key().to_bytes(), SponsorRelayerError::InvalidCloseAuthority);
                    if let Some(idx) = init_accounts.iter().position(|&x| x == instr.accounts[0].pubkey) {
                        let acc = init_accounts.remove(idx);

                    } else {
                        return Err(SponsorRelayerError::CloseAuthorityNotSet.into());
                    }
                } else if instr.data[1] == ACCOUNT_OWNER_AUTHORITY_TYPE {
                    // relayer shouldn't own any TA, so calling this should be fine regardless
                } else {
                    return Err(SponsorRelayerError::InvalidInstruction.into());
                }
            }
        } else if instr.program_id == associated_token::ID {
            // allow ata creation
            if instr.data.len() == 0 || instr.data[0] == ATA_CREATE_DISCRIMINATOR /*|| instr.data[0] == ATA_CREATE_IDEMPOTENT_DISCRIMINATOR */{ // we don't want idempotent because it creates a possible exploit
                init_accounts.push(instr.accounts[1].pubkey);
                
                //mint at idx 3
                if let Some(mint) = ctx.accounts.sponsorship.mint {
                    require!(instr.accounts[3].pubkey == mint, SponsorRelayerError::InvalidMint);
                }
                
                rent += ctx.remaining_accounts.iter().find(|x| x.key == &instr.accounts[1].pubkey).unwrap().lamports();
            } else {
                return Err(SponsorRelayerError::InvalidInstruction.into());
            }
        } else if instr.program_id != memo::ID {
            // if its not the memo program, we fail 
            return Err(SponsorRelayerError::InvalidProgram.into());
        }
        
        index += 1;
    }

    if init_accounts.len() > 0 {
        return Err(SponsorRelayerError::CloseAuthorityNotSet.into());
    }

    let price = compute_price * (if compute_limit == 0 { 200000 * (index as u64 - 1) } else { compute_limit });

    if price > ctx.accounts.sponsorship.max_priority_fee {
        return Err(SponsorRelayerError::MaxPriorityFeeExceeded.into());
    }

    let price = price / 1_000_000 + signers.len() as u64 * 5_000 + rent;

    msg!("price: {}", price);

    ctx.accounts.relayer_wallet.add_lamports(price)?;
    ctx.accounts.sponsorship.sub_lamports(price)?;
    Ok(())
}
