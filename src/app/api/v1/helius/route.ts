'use server';

import { NextRequest, NextResponse } from 'next/server';
import { EnrichedTransaction } from "helius-sdk";
import { updateTransferDetails } from '@/logic/transferTracker';

export async function POST(req: NextRequest, res: NextResponse) {  // accept a webhook from helius and process it
  const body: EnrichedTransaction[] = await req.json();
  console.debug('helius webhook received', body);

  body.forEach(async (tx) => {
    try {
      await updateTransferDetails(tx);
    } catch (error) {
      console.error('Error updating transfer details:', error);
      throw error;
    }
  });

  return NextResponse.json({ message: 'Webhook received' });
}
