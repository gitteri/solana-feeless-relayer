import { v4 as uuidv4 } from 'uuid';
import { getSplTransferById, createSplTransfer as createSplTransferInDb } from '@/services/db/queries/splTransfer';
import { SplTransfer, transactionStatuses } from '@/app/types/splTransfer';
import { getMintInfo } from '@/app/config/mint';
import { EmbeddedWallet, ix_TransferSPL } from '@/utils/EmbeddedWallet';
import { memoTransferInstructionData } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
export async function getSplTransfer(id: string): Promise<SplTransfer | null> {
  return await getSplTransferById(id);
}

export async function createSplTransfer(sender: string, destination: string, amount: string, mintSymbol: string): Promise<SplTransfer> {
  const mint = getMintInfo(mintSymbol);
  const relayWallet = EmbeddedWallet.get();

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

  const splTransferTxn = await relayWallet.BuildTransaction(
    [ix_memo, ix_fee, ix_transfer], 
    await relayWallet.keymanager.getPublicKey()
  );

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
    feeInLamports: RELAY_FEE,
    feeInSpl: RELAY_FEE,
  };

  await createSplTransferInDb(splTransfer);

  // return serialized unsigned transaction bytes
  return splTransfer;
}