import { v4 as uuidv4 } from 'uuid';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Basic } from '../target/types/basic';
import { SponsorRelayer } from '../target/types/sponsor_relayer';
import { Keypair, PublicKey, sendAndConfirmTransaction, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Provider } from 'jotai';
import { AuthorityType, createAccount, createAssociatedTokenAccount, createAssociatedTokenAccountInstruction, createInitializeAccount3Instruction, createMint, createSetAuthorityInstruction, createTransferCheckedInstruction, createWithdrawWithheldTokensFromAccountsInstruction, getAssociatedTokenAddress, mintTo, TOKEN_PROGRAM_ID, transferChecked } from '@solana/spl-token';
import { getRelayerAccountPda, getSponsorshipAccountPda, InitializeRelayerArgs, InitializeSponsorshipArgs, InitializeTokenAccountArgs, SponsorRelayerClient, TransferRelayArgs } from '../src/sponsor-relayer-exports';
import {describe, expect, it} from '@jest/globals'

describe('sponsor-relayer', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SponsorRelayer as Program<SponsorRelayer>;

  const relayer = new Keypair();
  const relayerWallet = new Keypair();
  const sponsor = new Keypair();
  const mint = new Keypair();
  const mint2 = new Keypair();
  const user = new Keypair();
  const user2 = new Keypair();
  const user3 = new Keypair();
  let userTokenAccount: PublicKey;
  let user2TokenAccount: PublicKey;
  let userTokenAccount2: PublicKey;
  let user2TokenAccount2: PublicKey;
  const provider = anchor.AnchorProvider.env();

  let client: SponsorRelayerClient;

  it('should setup wallets',async () => {
    
    // airdrop
    const txs = await Promise.all([
      provider.connection.requestAirdrop(relayer.publicKey, 1000000000000),
      provider.connection.requestAirdrop(sponsor.publicKey, 1000000000000),
      provider.connection.requestAirdrop(relayerWallet.publicKey, 1000000000000),
      //provider.connection.requestAirdrop(ta.publicKey, 1000000)
    ]);

    await Promise.all(txs.map(tx => provider.connection.confirmTransaction(tx, "confirmed")));
    // create mint
    await createMint(provider.connection, sponsor, sponsor.publicKey, null, 6, mint, {commitment: "processed"});
    await createMint(provider.connection, sponsor, sponsor.publicKey, null, 6, mint2, {commitment: "processed"});

    // create token accounts
    userTokenAccount = await createAssociatedTokenAccount(provider.connection, sponsor, mint.publicKey, user.publicKey, {commitment: "processed"});
    user2TokenAccount = await createAssociatedTokenAccount(provider.connection, sponsor, mint.publicKey, user2.publicKey, {commitment: "processed"} );
    userTokenAccount2 = await createAssociatedTokenAccount(provider.connection, sponsor, mint2.publicKey, user.publicKey, {commitment: "processed"});
    user2TokenAccount2 = await createAssociatedTokenAccount(provider.connection, sponsor, mint2.publicKey, user2.publicKey, {commitment: "processed"});

    // mint tokens
    await mintTo(provider.connection, sponsor, mint.publicKey, userTokenAccount, sponsor, 10000000, undefined, {commitment: "processed"} );
    await mintTo(provider.connection, sponsor, mint2.publicKey, userTokenAccount2, sponsor, 10000000, undefined, {commitment: "processed"});
    await mintTo(provider.connection, sponsor, mint.publicKey, user2TokenAccount, sponsor, 10000000, undefined, {commitment: "processed"});

    client = new SponsorRelayerClient({connection: provider.connection, confirmationOptions: {skipPreflight: true}, rpcUrl: provider.connection.rpcEndpoint}, new anchor.Wallet(relayerWallet));
    
  }, 60000);


  it('should setup sponsorship', async () => {
    // Add your test here.

    const initSponsor: InitializeSponsorshipArgs = {
      sponsor: sponsor.publicKey,
      mint: mint.publicKey,
      maxPriorityFee: new anchor.BN(0),
      allowPermissionlessRelayers: true,
      sponsorshipAmount: new anchor.BN(1000000000),
      fundRent: true,
    }

    let ix = await client.initializeSponsorship(initSponsor);

    await sendAndConfirmTransaction(client.provider.connection, new Transaction().add(ix), [sponsor], {skipPreflight: true, commitment: "processed"});
  });

  it('should setup relayer', async () => {

    const sponsorship = getSponsorshipAccountPda(sponsor.publicKey);

    const initRelayer: InitializeRelayerArgs = {
      authority: relayer.publicKey,
      relayerWallet: relayerWallet.publicKey,
      sponsorship: sponsorship,
    }

    let ix2 = await client.initializeRelayer(initRelayer);
    await sendAndConfirmTransaction(client.provider.connection, new Transaction().add(ix2), [relayer], {skipPreflight: true, commitment: "processed"});

  });
    

  it('should transfer relay', async () => {
    const relayTransferArgs: TransferRelayArgs = {
      relayerWallet: relayerWallet.publicKey,
      createdTokenAccounts: [],
      tokenProgram: TOKEN_PROGRAM_ID,
      owner: user.publicKey,
      from: userTokenAccount,
      to: user2TokenAccount,
      mint: mint.publicKey,
      amount: 1000000,
      decimals: 6,
    };
    
    const memoId = uuidv4();
    const ix_memo = new TransactionInstruction({
      keys: [],
      data: Buffer.from(memoId, "utf-8"),
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
    });

    let ix3 = await client.transferRelay(relayTransferArgs);
    let tx3 = new Transaction().add(ix_memo, ...ix3);
    tx3.feePayer = relayerWallet.publicKey;
    await sendAndConfirmTransaction(client.provider.connection, tx3, [relayerWallet, user], {skipPreflight: true});
  });

  it('should fail on two relay ix', async () => {
    const relayTransferArgs: TransferRelayArgs = {
      relayerWallet: relayerWallet.publicKey,
      createdTokenAccounts: [],
      tokenProgram: TOKEN_PROGRAM_ID,
      owner: user.publicKey,
      from: userTokenAccount,
      to: user2TokenAccount,
      mint: mint.publicKey,
      amount: 1000000,
      decimals: 6,
    };

    let ix3 = await client.transferRelay(relayTransferArgs);
    let anotherRelayIx = await client.relay({relayerWallet: relayerWallet.publicKey, tokenProgram: TOKEN_PROGRAM_ID});

    let tx3 = new Transaction().add(...ix3, anotherRelayIx);
    tx3.feePayer = relayerWallet.publicKey;
    await expect(sendAndConfirmTransaction(client.provider.connection, tx3, [relayerWallet, user], {skipPreflight: true})).rejects.toThrow();
  });

  it('should allow funding an account for a third party', async () => {
    const args: TransferRelayArgs = {
      relayerWallet: relayerWallet.publicKey,
      createdTokenAccounts: [],
      tokenProgram: TOKEN_PROGRAM_ID,
      owner: user.publicKey,
      from: userTokenAccount,
      to: user2TokenAccount,
      mint: mint.publicKey,
      amount: 1000000,
      decimals: 6,
    };

    let {ixs, additionalSigners} = await client.initializeTransferRelay(args);

    let tx = new Transaction().add(...ixs);
    tx.feePayer = relayerWallet.publicKey;
    await sendAndConfirmTransaction(client.provider.connection, tx, [relayerWallet, user, ...additionalSigners], {skipPreflight: true});
  });

  it('should fail on missing instructions from funding rent on TAs', async () => {
    
    const args: TransferRelayArgs = {
      relayerWallet: relayerWallet.publicKey,
      createdTokenAccounts: [],
      tokenProgram: TOKEN_PROGRAM_ID,
      owner: user.publicKey,
      from: userTokenAccount,
      to: user2TokenAccount,
      mint: mint.publicKey,
      amount: 1000000,
      decimals: 6,
    };

    let {ixs, additionalSigners} = await client.initializeTransferRelay(args);

    let tx = new Transaction().add(...ixs.slice(0, -4), ...ixs.slice(-2));
    tx.feePayer = relayerWallet.publicKey;
    await expect(sendAndConfirmTransaction(client.provider.connection, tx, [relayerWallet, user, ...additionalSigners], {skipPreflight: true})).rejects.toThrow();

    // let tx2 = new Transaction().add(...ixs.slice(0, -3), ...ixs.slice(-2));
    // tx2.feePayer = relayerWallet.publicKey;
    // await expect(sendAndConfirmTransaction(client.provider.connection, tx2, [relayerWallet, user, ...additionalSigners], {skipPreflight: true})).rejects.toThrow();
  });

  it('should allow funding ATAs', async () => {
    const newUser = new Keypair();
    const args: InitializeTokenAccountArgs = {
      relayerWallet: relayerWallet.publicKey,
      mint: mint.publicKey,
      owner: newUser.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    };

    let ix = await client.initializeTokenAccount(args);

    let tx = new Transaction().add(...ix);
    tx.feePayer = relayerWallet.publicKey;
    await sendAndConfirmTransaction(client.provider.connection, tx, [relayerWallet, newUser], {skipPreflight: true});
  });

  it('should fail on sending a different mint', async () => {
    const args: TransferRelayArgs = {
      relayerWallet: relayerWallet.publicKey,
      createdTokenAccounts: [],
      tokenProgram: TOKEN_PROGRAM_ID,
      owner: user.publicKey,
      from: userTokenAccount2,
      to: user2TokenAccount2,
      mint: mint2.publicKey,
      amount: 1000000,
      decimals: 6,
    };

    let ix = await client.transferRelay(args);
    let tx = new Transaction().add(...ix);
    tx.feePayer = relayerWallet.publicKey;
    await expect(sendAndConfirmTransaction(client.provider.connection, tx, [relayerWallet, user], {skipPreflight: true})).rejects.toThrow();

  });
  
});
