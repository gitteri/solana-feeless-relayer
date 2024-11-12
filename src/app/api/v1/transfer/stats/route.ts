'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getTransferStats } from '@/logic/transferStats';

// Define the type for the transfer stats response
type TransferStatsResponse = {
  feesAccumulated: string;
  feesSpent: string;
  requestedTransfers: number;
  completedTransfers: number;
  error?: string;
};

// Handle GET requests to retrieve transfer stats
export async function GET(req: NextRequest, res: NextResponse<TransferStatsResponse | { error: string }>) {
  try {
    const stats = await getTransferStats();
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch transfer stats', error);
    return NextResponse.json({ error: 'Failed to fetch transfer stats' }, { status: 500 });
  }
};
