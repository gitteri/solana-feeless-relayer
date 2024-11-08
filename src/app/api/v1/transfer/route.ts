'use server';

import { NextRequest, NextResponse } from 'next/server';
import { validate } from 'uuid';
import { SplTransfer, TransactionStatus } from '@/app/types/splTransfer';
import { getSplTransfer, getSplTransfers } from '@/logic/transactionEngine';

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

// Handle GET requests to retrieve a list of transactions
// To generate new transactions, use the actions/transfer endpoint.
export async function GET(req: NextRequest, res: NextResponse<PublicSplTransfer[] | { error: string }>) {
  const requestUrl = new URL(req.url);
  const limit = parseInt(requestUrl.searchParams.get('limit') ?? '20');
  const offset = parseInt(requestUrl.searchParams.get('offset') ?? '0');

  const splTransfers = await getSplTransfers(limit, offset);
  if (!splTransfers) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }
  return NextResponse.json(splTransfers.map(splTransferToPublicSplTransfer), { status: 200 });
};
