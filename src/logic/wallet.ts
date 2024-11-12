import { EmbeddedWallet } from '@/utils/EmbeddedWallet';
import { RpcService } from '@/services/rpcService';
import { supportedMints } from '@/app/config/mint';
import { lamportsToSolString } from '@/utils/balances';

export async function getEmbeddedWalletBalance(): Promise<{ token: string; balance: string; }[]> {
  try {
    const rpcService = new RpcService();
    const walletCore = EmbeddedWallet.get();
    const relayWalletPublicKey = await walletCore.keymanager.getAddress();

    const splBalances = await Promise.all(
      Object.keys(supportedMints).map(async (mint) => ({token: mint, balance: await rpcService.getSplBalance(relayWalletPublicKey, supportedMints[mint].address)}))
    );
    const solBalance = await rpcService.getSolBalance(relayWalletPublicKey);

    return [{token: 'SOL', balance: lamportsToSolString(solBalance)}, ...splBalances];
  } catch (error) {
    console.error('Failed to fetch embedded wallet balances', error);
    return [];
  }
}
