import { NextApiRequest, NextApiResponse } from 'next';
import { getFeeForSplTokenTransfer } from '@/logic/fee';
import { supportedMints } from '@/app/config/mint';

interface FeeResponse extends NextApiResponse {
  json: (body: { feeInSPL: string } | { error: string }) => void;
}

interface FeeRequest extends NextApiRequest {
  query: {
    mintSymbol: string;
  };
}

const convertLamportsToUSD = async (lamports: string): Promise<string> => {
  const lamportsPerSol = 1000000000;
  const solAmount = parseFloat(lamports) / lamportsPerSol;

  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
  const data = await response.json();
  const solToUsdRate = data.solana.usd;

  const usdAmount = solAmount * solToUsdRate;
  return usdAmount.toFixed(2);
};

const validateFeeRequest = (req: FeeRequest): { error: string } | null => {
  const { mintSymbol } = req.query;
  if (!mintSymbol) {
    return { error: 'Mint symbol is required' };
  }
  if (!(mintSymbol in supportedMints)) {
    return { error: 'Unsupported mint symbol' };
  }
  return null;
};

export async function GET(req: FeeRequest, res: FeeResponse) {
  // validate the request
  const validationError = validateFeeRequest(req);
  if (validationError) {
    return res.status(400).json(validationError);
  }
  try {
    const feeInSPL = await getFeeForSplTokenTransfer(req.query.mintSymbol)

    return res.status(200).json({ feeInSPL });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve fee' });
  }
}
