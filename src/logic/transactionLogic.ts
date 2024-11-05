import { v4 as uuidv4 } from 'uuid';
import { getSplTransferById, createSplTransfer as createSplTransferInDb } from '@/services/db/queries/splTransfer';
import { SplTransfer, transactionStatuses } from '@/app/types/splTransfer';
import { supportedMints } from '@/app/config/mint';

export async function getSplTransfer(id: string): Promise<SplTransfer | null> {
  return await getSplTransferById(id);
}

export async function createSplTransfer(sender: string, destination: string, amount: string, mintSymbol: string): Promise<string | null> {
  // TODO: get and set the current fee
  const mint = supportedMints[mintSymbol as keyof typeof supportedMints];

  // TODO: generate the transaction bytes
  const splTransfer = {
    id: uuidv4(),
    sender,
    destination,
    amount,
    mint: mint.address,
    mintSymbol,
    unsignedTransactionBytes: '',
    currentStatus: transactionStatuses.INIT,
  };

  // return serialized unsigned transaction bytes
  await createSplTransferInDb(splTransfer);

  return splTransfer.unsignedTransactionBytes;
}
