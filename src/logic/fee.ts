import { PublicKey, Transaction } from '@solana/web3.js';
import { createTransferCheckedInstruction, TOKEN_PROGRAM_ID as SPL_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { supportedMints } from '@/app/config/mint';
import { RpcService } from '@/services/rpcService';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com'; // Replace with your RPC endpoint

export const getFeeForSplTokenTransfer = async (mintSymbol: string): Promise<string> => {
  const rpcService = new RpcService();
  const feeInLamports = await rpcService.estimateFeeInLamports(mintSymbol);
  // TODO: convert lamports to SPL
  // TODO: add premium to the fee for the relayer
  return feeInLamports;
}
