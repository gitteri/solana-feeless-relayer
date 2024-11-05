import { getFeeForSplTokenTransfer } from '@/logic/fee';
import { supportedMints } from '@/app/config/mint';
import { NextRequest, NextResponse } from 'next/server';

const validateFeeRequest = (req: NextRequest): { error: string } | null => {
  const mintSymbol = req.nextUrl.searchParams.get('mintSymbol');
  if (!mintSymbol) {
    return { error: 'Mint symbol is required' };
  }
  if (!(mintSymbol in supportedMints)) {
    return { error: 'Unsupported mint symbol' };
  }
  return null;
};

export async function GET(req: NextRequest, res: NextResponse<{ feeInSPL: string }>) {
  // validate the request
  const validationError = validateFeeRequest(req);
  if (validationError) {
    return NextResponse.json(validationError, { status: 400 });
  }
  try {
    const mintSymbol = req.nextUrl.searchParams.get('mintSymbol') as string;
    const feeInSPL = await getFeeForSplTokenTransfer(mintSymbol);

    return NextResponse.json({ feeInSPL }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve fee' }, { status: 500 });
  }
}
