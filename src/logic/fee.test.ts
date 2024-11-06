import { RpcService } from '@/services/rpcService';
import { getMintInfo } from '@/app/config/mint';
import { getFeeForSplTokenTransfer } from './fee';
import { PriceFeed } from '@/services/priceFeed';

describe('getFeeForSplTokenTransfer', () => {
  let originalFetch: typeof global.fetch;
  const USDC_MINT_SYMBOL = 'USDC';
  try {
    getMintInfo(USDC_MINT_SYMBOL);
  } catch (error) {
    throw new Error('USDC is not a supported mint symbol and is needed for these tests');
  }

  // Do not run this in CI because it makes a live call to a node and the Coingecko API
  if (process.env.NODE_PROCESS !== 'ci') {
    it('should return a valid fee in USD for a supported mint symbol', async () => {
      const feeInUsd = await getFeeForSplTokenTransfer(USDC_MINT_SYMBOL);
      expect(typeof feeInUsd).toBe('string');
      expect(parseFloat(feeInUsd)).toBeGreaterThan(0);
    });

    it('should throw an error for an unsupported mint symbol', async () => {
      const mintSymbol = 'INVALID';

      await expect(getFeeForSplTokenTransfer(mintSymbol)).rejects.toThrow('Unsupported mint symbol');
    });
  }

  it('should return the fee for USDC', async () => {
    // Mock the RpcService methods
    jest.spyOn(RpcService.prototype, 'estimateFeeInLamports').mockResolvedValue(BigInt(1000000));

    // Mock the PriceFeed methods
    jest.spyOn(PriceFeed.prototype, 'getSolPrice').mockResolvedValue('170.48');

    const fee = await getFeeForSplTokenTransfer(USDC_MINT_SYMBOL);
    expect(typeof fee).toBe('string');
    expect(Number(fee)).not.toBeNaN();
  });

  it('should throw an error for unsupported mint symbol', async () => {
    const mintSymbol = 'UNSUPPORTED';
    await expect(getFeeForSplTokenTransfer(mintSymbol)).rejects.toThrow('Unsupported mint symbol');
  });

  it('should handle RPC service errors gracefully', async () => {
    // Mock the RpcService methods to throw an error
    jest.spyOn(RpcService.prototype, 'estimateFeeInLamports').mockRejectedValue(new Error('RPC error'));

    await expect(getFeeForSplTokenTransfer(USDC_MINT_SYMBOL)).rejects.toThrow('RPC error');
  });

  it('should convert lamports to USD correctly', async () => {
    // Mock the RpcService methods
    jest.spyOn(RpcService.prototype, 'estimateFeeInLamports').mockResolvedValue(BigInt(1000000000)); // 1 SOL

    // Mock the PriceFeed methods
    jest.spyOn(PriceFeed.prototype, 'getSolPrice').mockResolvedValue('170.48');

    const fee = await getFeeForSplTokenTransfer(USDC_MINT_SYMBOL);
    expect(fee).toBe('170.48');
  });

  it('should handle fetch errors gracefully', async () => {
    // Mock the RpcService methods
    jest.spyOn(RpcService.prototype, 'estimateFeeInLamports').mockResolvedValue(BigInt(1000000000)); // 1 SOL

    // Mock the PriceFeed methods
    jest.spyOn(PriceFeed.prototype, 'getSolPrice').mockRejectedValue(new Error('Fetch error'));

    await expect(getFeeForSplTokenTransfer(USDC_MINT_SYMBOL)).rejects.toThrow('Fetch error');
  });

  it('should throw an error for invalid SOL to USD rate', async () => {
    // Mock the RpcService methods
    jest.spyOn(RpcService.prototype, 'estimateFeeInLamports').mockResolvedValue(BigInt(1000000000)); // 1 SOL

    // Mock the PriceFeed methods
    jest.spyOn(PriceFeed.prototype, 'getSolPrice').mockResolvedValue('invalid');

    await expect(getFeeForSplTokenTransfer(USDC_MINT_SYMBOL)).rejects.toThrow('pyth returned an invalid SOL to USD rate');
  });
});
