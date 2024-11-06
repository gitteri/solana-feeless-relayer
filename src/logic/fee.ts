import Decimal from 'decimal.js';
import { RpcService } from '@/services/rpcService';
import { getMintInfo } from '@/app/config/mint';
import { PriceFeed } from '@/services/priceFeed';

const convertLamportsToUSD = async (lamports: bigint): Promise<string> => {
  const lamportsPerSol = new Decimal(1000000000);
  const solAmount = new Decimal(lamports.toString()).div(lamportsPerSol);

  // TODO: allow this to work for non-USD currencies
  let solToUsdRate = '';
  try {
    const priceFeed = new PriceFeed();
    solToUsdRate = await priceFeed.getSolPrice();
    if (solToUsdRate === undefined || isNaN(Number(solToUsdRate))) {
      throw new Error('pyth returned an invalid SOL to USD rate', { cause: solToUsdRate });
    }
  } catch (error) {
    console.error('Error fetching SOL to USD rate:', error);
    throw error;
  }

  return solAmount.mul(new Decimal(solToUsdRate)).toString();
};

export const getFeeForSplTokenTransfer = async (mintSymbol: string): Promise<string> => {
  // validate the mint symbol
  try {
    getMintInfo(mintSymbol);
  } catch (error) {
    throw new Error('Unsupported mint symbol');
  }

  const rpcService = new RpcService();
  const estimateFeeResponse = await rpcService.estimateFeeInLamports(mintSymbol);
  const feeInUsd = await convertLamportsToUSD(estimateFeeResponse);
  
  // TODO: add premium to the fee for the relayer
  return feeInUsd;
}
