import { v4 as uuidv4 } from 'uuid';
import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { SplTransfer, transactionStatuses } from '@/app/types/splTransfer';
import { getMintInfo } from '@/app/config/mint';
import { RpcService } from '@/services/rpcService';
import { getSplTransferById, createSplTransfer as createSplTransferInDb } from '@/services/db/queries/splTransfer';
import { EmbeddedWallet, ix_TransferSPL } from '@/utils/EmbeddedWallet';
import { getAssociatedTokenAddressSync, getMint, getAccountLenForMint } from '@solana/spl-token';
import { TOKEN_PROGRAM_ID, createInitializeAccountInstruction, createAccount } from '@solana/spl-token';

export async function getSplTransfer(id: string): Promise<SplTransfer | null> {
  return await getSplTransferById(id);
}

async function createSplTokenAccountInstructions(
  feePayer: string,
  owner: string,
  mint: string,
  programId = TOKEN_PROGRAM_ID
): Promise<TransactionInstruction[] | null> {
  const rpcService = new RpcService();
  const feePayerPublicKey = new PublicKey(feePayer);
  const ownerPublicKey = new PublicKey(owner);
  const mintPublicKey = new PublicKey(mint);
  if (await rpcService.hasTokenAccount(ownerPublicKey, mintPublicKey)) {
    return null;
  }
  const mintState = await getMint(rpcService.connection, mintPublicKey, undefined, programId);
  const space = getAccountLenForMint(mintState);
  const lamports = await rpcService.connection.getMinimumBalanceForRentExemption(space);
  const newAccount = await getAssociatedTokenAddressSync(ownerPublicKey, mintPublicKey, true, TOKEN_PROGRAM_ID);

  return [SystemProgram.createAccount({
    fromPubkey: feePayerPublicKey,
    newAccountPubkey: newAccount,
    space: space,
    lamports: lamports,
    programId: TOKEN_PROGRAM_ID,
  }),
  createInitializeAccountInstruction(
    newAccount,
    mintPublicKey,
    ownerPublicKey,
    TOKEN_PROGRAM_ID,
  )
  ];
}

export async function createSplTransfer(sender: string, destination: string, amount: string, mintSymbol: string): Promise<SplTransfer> {
  const mint = getMintInfo(mintSymbol);
  const relayWallet = EmbeddedWallet.get();

  // TODO: make this dynamic and based on if the token account needs to be created
  const RELAY_FEE = '500000'; // 0.50 USDC/USDT (6 decimal places)
  const relayWalletPublicKey = await relayWallet.keymanager.getAddress();

  const memoId = uuidv4();
  const ix_memo = new TransactionInstruction({
    keys: [],
    data: Buffer.from(memoId, "utf-8"),
    programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
  })

  const ix_fee = await ix_TransferSPL(
    sender,
    await relayWallet.keymanager.getAddress(),
    RELAY_FEE,
    mint.address,
    mint.address
  );

  const ix_transfer = await ix_TransferSPL(
    sender,
    destination,
    amount,
    mint.address,
    mint.address
  );

  // TODO: if getting a rebate also transfer close account authority to a different account to prevent a drain attack
  const ix_createAccount = await createSplTokenAccountInstructions(relayWalletPublicKey, sender, mint.address);

  const splTransferTxn = await relayWallet.BuildTransaction(
    [ix_memo, ix_fee, ...(ix_createAccount ?? []), ix_transfer], 
    await relayWallet.keymanager.getPublicKey()
  );

  const rpcService = new RpcService();
  const estimatedFeeInLamports = await rpcService.estimateFeeInLamports(mintSymbol);  

  await relayWallet.SignTransaction(splTransferTxn);

  const splTransfer: SplTransfer = {
    id: uuidv4(),
    referenceId: memoId,
    sender,
    destination,
    amount,
    mint: mint.address,
    mintSymbol,
    unsignedTransactionBytes: Buffer.from(splTransferTxn.serialize()),
    currentStatus: transactionStatuses.INIT,
    feePayer: relayWalletPublicKey,
    feeInSpl: RELAY_FEE,
    estimatedFeeInLamports: estimatedFeeInLamports.toString(),
  };

  await createSplTransferInDb(splTransfer);

  // return serialized unsigned transaction bytes
  return splTransfer;
}