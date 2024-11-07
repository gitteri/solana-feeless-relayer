import { EnrichedTransaction } from "helius-sdk";
import { transactionStatuses } from '@/app/types/splTransfer';
import { addTransactionStatus, updateSplTransfer } from "@/services/db/queries/splTransfer";
import bs58 from 'bs58';

/**
 * Updates the transfer database record with details from a Helius enriched transaction.
 * @param {EnrichedTransaction} enrichedTransaction - The enriched transaction from Helius.
 * @returns {Promise<void>}
 */
export async function updateTransferDetails(enrichedTransaction: EnrichedTransaction): Promise<void> {
  try {
    const { signature, instructions, slot, timestamp, nativeTransfers, tokenTransfers } = enrichedTransaction;

    const memoIx = instructions.find((instruction) => {
      return instruction.programId.toString() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
    });
    if (!memoIx) {
      // this is not a relayed transaction, so we don't need to process it
      // TODO: parse these to ensure they are not nefarious
      console.warn('No memo instruction found', signature);
      return;
    }

    const referenceId = new TextDecoder('utf-8').decode(bs58.decode(memoIx.data));

    // Construct the update payload
    const updatePayload = {
      signature,
      slot,
      timestampIncluded: new Date(timestamp * 1000),
    };

    // Update the transfer record in the database
    await updateSplTransfer(referenceId, updatePayload);
    await addTransactionStatus(referenceId, transactionStatuses.CONFIRMED);
    console.log(`Successfully updated transfer record for transaction ID: ${signature}`);
  } catch (error) {
    console.error("Error updating transfer record:", error);
    throw error;
  }
}
