'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getSplTransfers } from '@/logic/transactionEngine';
import { PublicSplTransfer, splTransferToPublicSplTransfer } from './publicSplTransfer';

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
