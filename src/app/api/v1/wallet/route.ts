'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getEmbeddedWalletBalance } from '@/logic/wallet';

// Define the type for the wallet balance response
type WalletBalanceResponse = {
  balances: { token: string; balance: string; }[];
  error?: string;
};

// Handle GET requests to retrieve wallet balances
export async function GET(req: NextRequest, res: NextResponse<WalletBalanceResponse | { error: string }>) {
  try {
    const balances = await getEmbeddedWalletBalance();
    if (balances.length === 0) {
      return NextResponse.json({ error: 'No balances found' }, { status: 404 });
    }
    return NextResponse.json(balances, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch wallet balances', error);
    return NextResponse.json({ error: 'Failed to fetch wallet balances' }, { status: 500 });
  }
};
