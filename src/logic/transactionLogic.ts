import { v4 as uuidv4 } from 'uuid';
import { getSplTransferById, createSplTransfer as createSplTransferInDb } from '@/services/db/queries/splTransfer';
import { SplTransfer, transactionStatuses } from '@/app/types/splTransfer';
import { supportedMints } from '@/app/config/mint';
import { EmbeddedWallet, ix_TransferSPL } from '@/utils/EmbeddedWallet';
export async function getSplTransfer(id: string): Promise<SplTransfer | null> {
  return await getSplTransferById(id);
}

export async function createSplTransfer(sender: string, destination: string, amount: string, mintSymbol: string): Promise<SplTransfer> {
  const mintAddress = supportedMints[mintSymbol as keyof typeof supportedMints];
  const relayWallet = await EmbeddedWallet.get();

  const RELAY_FEE = '500000'; // 0.50 USDC/USDT (6 decimal places)

  const ix_fee = await ix_TransferSPL(
    sender,
    destination,
    RELAY_FEE,
    mintAddress,
    mintAddress
  );

  const ix_transfer = await ix_TransferSPL(
    sender,
    destination,
    amount,
    mintAddress,
    mintAddress
  );

  const splTransferTxn = await relayWallet.BuildTransaction(
    [ix_fee, ix_transfer], 
    await relayWallet.keymanager.getPublicKey()
  );

  await relayWallet.SignTransaction(splTransferTxn);

  const splTransfer: SplTransfer = {
    id: uuidv4(),
    sender,
    destination,
    amount,
    mint: mintAddress,
    mintSymbol,
    unsignedTransactionBytes: Buffer.from(splTransferTxn.serialize()),
    currentStatus: transactionStatuses.INIT,
    feeInLamports: RELAY_FEE,
    feeInSpl: RELAY_FEE,
  };

  await createSplTransferInDb(splTransfer);

  // return serialized unsigned transaction bytes
  return splTransfer;
}