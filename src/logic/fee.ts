import Decimal from 'decimal.js';
import { RpcService } from '@/services/rpcService';
import { supportedMints } from '@/app/config/mint';

const convertLamportsToUSD = async (lamports: bigint): Promise<string> => {
  const lamportsPerSol = new Decimal(1000000000);
  const solAmount = new Decimal(lamports.toString()).div(lamportsPerSol);

  // TODO: allow this to work for non-USD currencies
  let solToUsdRate = '';
  try {
    // TODO: use more than one source for the rate
    // TODO: use a cache
    // TODO: retry logic
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();
    solToUsdRate = data.solana.usd;
    if (solToUsdRate === undefined || isNaN(Number(solToUsdRate))) {
      throw new Error('coingecko returned an invalid SOL to USD rate', { cause: solToUsdRate });
    }
  } catch (error) {
    console.error('Error fetching SOL to USD rate:', error);
    throw error;
  }

  return solAmount.mul(new Decimal(solToUsdRate)).toString();
};

export const getFeeForSplTokenTransfer = async (mintSymbol: string): Promise<string> => {
  // validate the mint symbol
  if (!(mintSymbol in supportedMints)) {
    throw new Error('Unsupported mint symbol');
  }

  const rpcService = new RpcService();
  const estimateFeeResponse = await rpcService.estimateFeeInLamports(mintSymbol);
  const feeInUsd = await convertLamportsToUSD(estimateFeeResponse);
  
  // TODO: add premium to the fee for the relayer
  return feeInUsd;
}
