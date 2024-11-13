'use server';

import { NextRequest, NextResponse } from 'next/server';
import { SplTransfer, TransactionStatus } from '@/app/types/splTransfer';
import { getSplTransfers } from '@/logic/transactionEngine';

// This type is used to return the transaction to the client.
// It is used to hide certain fields from the public and to convert the amount to a string.
export type PublicSplTransfer = Omit<SplTransfer, 'signedTransactionBytes' | 'requestedByIp' | 'amount' | 'estimatedFeeInLamports' | 'feeInLamports' | 'feeInSpl'> & {
  currentStatus: TransactionStatus;
  amount: string;
  estimatedFeeInLamports: string;
  feeInLamports: string;
  feeInSpl: string;
};

// Convert a SplTransfer object to a PublicSplTransfer object
export const splTransferToPublicSplTransfer = (splTransfer: SplTransfer): PublicSplTransfer => {
  return {
    ...splTransfer,
    amount: splTransfer.amount.toString(),
    estimatedFeeInLamports: splTransfer.estimatedFeeInLamports ? splTransfer.estimatedFeeInLamports.toString() : '0',
    feeInLamports: splTransfer.feeInLamports ? splTransfer.feeInLamports.toString() : '0',
    feeInSpl: splTransfer.feeInSpl ? splTransfer.feeInSpl.toString() : '0',
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
