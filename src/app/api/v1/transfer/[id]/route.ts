'use server';

import { NextRequest, NextResponse } from 'next/server';
import { validate } from 'uuid';
import { SplTransfer, TransactionStatus } from '@/app/types/splTransfer';
import { getSplTransfer } from '@/logic/transactionEngine';

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
// To generate new transactions, use the actions/transfer endpoint.
export async function GET(req: NextRequest, res: NextResponse<PublicSplTransfer | { error: string }>) {
  const id = req.nextUrl.pathname.split('/').pop();

  const validationError = validateGetSplTransferRequest(id);
  if (validationError) {
    return NextResponse.json(validationError, { status: 400 });
  }

  const splTransfer = await getSplTransfer(id as string);
  if (!splTransfer) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }
  return NextResponse.json(splTransferToPublicSplTransfer(splTransfer), { status: 200 });
};
