// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, BN, IdlAccounts, IdlTypes, Program, Wallet } from '@coral-xyz/anchor'
import { ConfirmOptions, Connection, Keypair, PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, TransactionInstruction } from '@solana/web3.js'
import SponsorRelayerIDL from '../target/idl/sponsor_relayer.json'
import type { SponsorRelayer } from '../target/types/sponsor_relayer'
import { IdlType } from '@coral-xyz/anchor/dist/cjs/idl'
import { AuthorityType, createAssociatedTokenAccountInstruction, createInitializeAccount3Instruction, createSetAuthorityInstruction, createTransferCheckedInstruction, getAccountLenForMint, getAssociatedTokenAddress, getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token'

// Re-export the generated IDL and type
export { SponsorRelayer, SponsorRelayerIDL }

// The programId is imported from the program IDL.
export const SPONSOR_RELAYER_PROGRAM_ID = new PublicKey(SponsorRelayerIDL.address)

// This is a helper function to get the Basic Anchor program.
export function getSponsorRelayerProgram(provider: AnchorProvider) {
  return new Program(SponsorRelayerIDL as SponsorRelayer, provider)
}

export function getSponsorshipAccountPda(sponsor: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("sponsorship"), sponsor.toBuffer()], SPONSOR_RELAYER_PROGRAM_ID)[0];
}

export function getRelayerAccountPda(relayerWallet: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("relayer"), relayerWallet.toBuffer()], SPONSOR_RELAYER_PROGRAM_ID)[0];
}

export type SponsorshipAccount = IdlAccounts<SponsorRelayer>["sponsorship"];
export type RelayerAccount = IdlAccounts<SponsorRelayer>["relayer"];

//new Program(AssetControllerIdl as Idl, provider) as unknown as Program<AssetControllerIdlTypes>;
export type Config = {
  connection: Connection;
  rpcUrl: string;
  confirmationOptions: ConfirmOptions;
};

export class SponsorRelayerClient {
	config: Config;
	provider: AnchorProvider;
  program: Program<SponsorRelayer>;

  constructor(config: Config, wallet: Wallet) {
    this.config = config;
    this.provider = new AnchorProvider(
			config.connection,
			wallet,
			config.confirmationOptions
		);
    this.program = new Program(SponsorRelayerIDL as SponsorRelayer, this.provider);
  }

  async getSponsorshipAccount(sponsor: PublicKey): Promise<SponsorshipAccount> {
    return this.program.account.sponsorship.fetch(sponsor);
  }

  async getRelayerAccount(relayerWallet: PublicKey): Promise<RelayerAccount> {
    return this.program.account.relayer.fetch(getRelayerAccountPda(relayerWallet));
  }

  async initializeSponsorship(args: InitializeSponsorshipArgs): Promise<TransactionInstruction> {
    return await getInitializeSponsorshipInstruction(args, this.program);
  }

  async initializeRelayer(args: InitializeRelayerArgs): Promise<TransactionInstruction> {
    return await getInitializeRelayerInstruction(args, this.program);
  }

  async authorizeRelayer(args: AuthorizeRelayerArgs): Promise<TransactionInstruction> {
    return await getAuthorizeRelayerInstruction(args, this.program);
  }

  async relay(args: RelayArgs): Promise<TransactionInstruction> {
    return await getRelayInstruction(args, this.program);
  }

  async transferRelay(args: TransferRelayArgs): Promise<TransactionInstruction[]> {
    return await getTransferRelayInstructions(args, this.program);
  }

  async initializeTokenAccount(args: InitializeTokenAccountArgs): Promise<TransactionInstruction[]> {
    return await getInitializeTokenAccountInstructions(args, this.program);
  }

  async initializeTransferRelay(args: TransferRelayArgs): Promise<ReturnIx> {
    return await getInitializeTransferRelayInstructions(args, this.program);
  }

}

export type InitializeSponsorshipArgs = {
  sponsor: PublicKey;
  maxPriorityFee: BN;
  allowPermissionlessRelayers: boolean;
  mint?: PublicKey;
  sponsorshipAmount: BN;
  fundRent: boolean;
}

export async function getInitializeSponsorshipInstruction(args: InitializeSponsorshipArgs, program: Program<SponsorRelayer>): Promise<TransactionInstruction> {
  return await program.methods.initializeSponsorship(args.maxPriorityFee, args.allowPermissionlessRelayers, args.mint? args.mint : null, args.sponsorshipAmount, args.fundRent)
  .accountsStrict({
    sponsorship: getSponsorshipAccountPda(args.sponsor),
    authority: args.sponsor,
    systemProgram: SystemProgram.programId,
  }).instruction();
}

export type InitializeRelayerArgs = {
  authority: PublicKey;
  relayerWallet: PublicKey;
  sponsorship: PublicKey;
}

export async function getInitializeRelayerInstruction(args: InitializeRelayerArgs, program: Program<SponsorRelayer>): Promise<TransactionInstruction> {
  return await program.methods.initializeRelayer().accountsStrict({
    authority: args.authority,
    relayer: getRelayerAccountPda(args.relayerWallet),
    sponsorship: args.sponsorship,
    relayerWallet: args.relayerWallet,
    systemProgram: SystemProgram.programId,
  }).instruction();
}

export type AuthorizeRelayerArgs = {
  authority: PublicKey;
  relayer: PublicKey;
  sponsorshipCap: BN;
}

export async function getAuthorizeRelayerInstruction(args: AuthorizeRelayerArgs, program: Program<SponsorRelayer>): Promise<TransactionInstruction> {
  return await program.methods.authorizeRelayer(args.sponsorshipCap).accountsStrict({
    authority: args.authority,
    relayer: args.relayer,
    sponsorship: getSponsorshipAccountPda(args.authority),
  }).instruction();
}

export type RelayArgs = {
  relayerWallet: PublicKey;
  tokenProgram: PublicKey;
  createdTokenAccounts?: PublicKey[];
}

export async function getRelayInstruction(args: RelayArgs, program: Program<SponsorRelayer>): Promise<TransactionInstruction> {
  return await program.methods.relay().accountsStrict({
    relayerWallet: args.relayerWallet,
    relayer: getRelayerAccountPda(args.relayerWallet),
    sponsorship: (await program.account.relayer.fetch(getRelayerAccountPda(args.relayerWallet))).sponsorship,
    tokenProgram: args.tokenProgram,
    instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
  }).remainingAccounts(args.createdTokenAccounts?.map(account => ({ pubkey: account, isSigner: false, isWritable: false })) ?? []).instruction();
}

export type TransferRelayArgs = {
  owner: PublicKey;
  from: PublicKey;
  to: PublicKey;
  mint: PublicKey;
  amount: number;
  decimals: number;
} & RelayArgs;

export async function getTransferRelayInstructions(args: TransferRelayArgs, program: Program<SponsorRelayer>): Promise<TransactionInstruction[]> {
  const transfer = createTransferCheckedInstruction(args.from, args.mint, args.to, args.owner, args.amount, args.decimals);
  
  return [
    transfer,
    await getRelayInstruction(args, program),
  ]
}

export type InitializeTokenAccountArgs = {
  owner: PublicKey;
  mint: PublicKey;
} & RelayArgs;

export async function getInitializeTokenAccountInstructions(args: InitializeTokenAccountArgs, program: Program<SponsorRelayer>): Promise<TransactionInstruction[]> {
  const ata = await getAssociatedTokenAddress(args.mint, args.owner);
  const createAta = createAssociatedTokenAccountInstruction(args.relayerWallet, ata, args.owner, args.mint);
  const setCloseAuthority = createSetAuthorityInstruction(ata, args.owner, AuthorityType.CloseAccount, args.relayerWallet);
  return [
    createAta,
    setCloseAuthority,
    await getRelayInstruction({...args, createdTokenAccounts: args.createdTokenAccounts?.concat([ata, args.mint]) ?? [ata, args.mint]}, program),
  ]
}

export type ReturnIx = {
  ixs: TransactionInstruction[];
  additionalSigners: Keypair[];
}




export async function getInitializeTransferRelayInstructions(args: TransferRelayArgs, program: Program<SponsorRelayer>): Promise<ReturnIx> {
  const kp = new Keypair();

  //get len
  const space = getAccountLenForMint(await getMint(program.provider.connection, args.mint));
  const lamports = await program.provider.connection.getMinimumBalanceForRentExemption(space);

  // create account
  const createTa = SystemProgram.createAccount({
    fromPubkey: args.relayerWallet,
    newAccountPubkey: kp.publicKey,
    space,
    lamports,
    programId: TOKEN_PROGRAM_ID,
  });

  // initialize account
  const ix = createInitializeAccount3Instruction(kp.publicKey, args.mint, args.relayerWallet);
  // set close authority
  const ix2 = createSetAuthorityInstruction(kp.publicKey, args.relayerWallet, AuthorityType.CloseAccount, args.relayerWallet);
  // set owner
  const ix3 = createSetAuthorityInstruction(kp.publicKey, args.relayerWallet, AuthorityType.AccountOwner, args.to);

  const relayerIx = await getTransferRelayInstructions({
    relayerWallet: args.relayerWallet,
    createdTokenAccounts: [kp.publicKey, args.mint],
    tokenProgram: args.tokenProgram,
    owner: args.owner,
    from: args.from,
    to: kp.publicKey,
    mint: args.mint,
    amount: args.amount,
    decimals: args.decimals,
  }, program);

  return {
    ixs: [createTa, ix, ix2, ix3, ...relayerIx],
    additionalSigners: [kp],
  }
}