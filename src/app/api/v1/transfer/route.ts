import { NextApiRequest, NextApiResponse } from 'next';
import { validate } from 'uuid';
import { SplTransfer, TransactionStatus } from '@/app/types/splTransfer';
import { getSplTransfer } from '@/logic/transactionLogic';

// This type is used to return the transaction to the client.
// It is used to hide certain fields from the public.
export type PublicSplTransfer = Omit<SplTransfer, 'signedTransactionBytes' | 'requestedByIp'> & {
  currentStatus: TransactionStatus;
};

// Convert a SplTransfer object to a PublicSplTransfer object
const splTransferToPublicSplTransfer = (splTransfer: SplTransfer): PublicSplTransfer => {
  return {
    ...splTransfer,
    currentStatus: splTransfer.currentStatus as TransactionStatus,
  };
};

const validateGetSplTransferRequest = (id?: any): { error: string } | null => {
  if (!id) {
    return { error: 'Transaction ID is required' };
  }
  if (typeof id !== 'string') {
    return { error: 'Transaction ID must be a string' };
  }
  if (!validate(id)) {
    return { error: 'Invalid Transaction ID format' };
  }
  return null;
}

// Handle GET requests to retrieve a transaction by ID
export async function GET(req: NextApiRequest, res: NextApiResponse<PublicSplTransfer | { error: string }>) {
  const { id } = req.query;
  const validationError = validateGetSplTransferRequest(id);
  if (validationError) {
    return res.status(400).json(validationError);
  }

  const splTransfer = await getSplTransfer(id as string);
  if (!splTransfer) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  return res.status(200).json(splTransferToPublicSplTransfer(splTransfer));
};

// To generate new transactions, use the actions/transfer endpoint.