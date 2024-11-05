import { RpcService } from '@/services/rpcService';
import { supportedMints } from '@/app/config/mint';
import { getFeeForSplTokenTransfer } from './fee';

describe('getFeeForSplTokenTransfer', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // Do not run this in CI because it makes a live call to a node and the Coingecko API
  if (process.env.NODE_PROCESS !== 'ci') {
    it('should return a valid fee in USD for a supported mint symbol', async () => {
      const mintSymbol = 'USDC';

      // Ensure the mint symbol is supported
      if (!(mintSymbol in supportedMints)) {
        throw new Error('USDC is not a supported mint symbol');
      }

      const feeInUsd = await getFeeForSplTokenTransfer(mintSymbol);
      expect(typeof feeInUsd).toBe('string');
      expect(parseFloat(feeInUsd)).toBeGreaterThan(0);
    });

    it('should throw an error for an unsupported mint symbol', async () => {
      const mintSymbol = 'INVALID';

      await expect(getFeeForSplTokenTransfer(mintSymbol)).rejects.toThrow('Unsupported mint symbol');
    });
  }

  it('should return the fee for USDC', async () => {
    const mintSymbol = 'USDC';
    if (!(mintSymbol in supportedMints)) {
      throw new Error('USDC is not a supported mint symbol');
    }

    // Mock the RpcService methods
    jest.spyOn(RpcService.prototype, 'estimateFeeInLamports').mockResolvedValue(BigInt(1000000));

    // Mock the fetch function to return a fixed USD rate for Solana
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ solana: { usd: 170.48 } }),
      })
    ) as jest.Mock;

    const fee = await getFeeForSplTokenTransfer(mintSymbol);
    expect(typeof fee).toBe('string');
    expect(Number(fee)).not.toBeNaN();
  });

  it('should throw an error for unsupported mint symbol', async () => {
    const mintSymbol = 'UNSUPPORTED';
    if (mintSymbol in supportedMints) {
      throw new Error('UNSUPPORTED should not be a supported mint symbol');
    }

    await expect(getFeeForSplTokenTransfer(mintSymbol)).rejects.toThrow('Unsupported mint symbol');
  });

  it('should handle RPC service errors gracefully', async () => {
    const mintSymbol = 'USDC';
    if (!(mintSymbol in supportedMints)) {
      throw new Error('USDC is not a supported mint symbol');
    }

    // Mock the RpcService methods to throw an error
    jest.spyOn(RpcService.prototype, 'estimateFeeInLamports').mockRejectedValue(new Error('RPC error'));

    await expect(getFeeForSplTokenTransfer(mintSymbol)).rejects.toThrow('RPC error');
  });

  it('should convert lamports to USD correctly', async () => {
    const mintSymbol = 'USDC';
    if (!(mintSymbol in supportedMints)) {
      throw new Error('USDC is not a supported mint symbol');
    }

    // Mock the RpcService methods
    jest.spyOn(RpcService.prototype, 'estimateFeeInLamports').mockResolvedValue(BigInt(1000000000)); // 1 SOL

    // Mock the fetch function to return a fixed USD rate for Solana
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ solana: { usd: 170.48 } }),
      })
    ) as jest.Mock;

    const fee = await getFeeForSplTokenTransfer(mintSymbol);
    expect(fee).toBe('170.48');
  });

  it('should handle fetch errors gracefully', async () => {
    const mintSymbol = 'USDC';
    if (!(mintSymbol in supportedMints)) {
      throw new Error('USDC is not a supported mint symbol');
    }

    // Mock the RpcService methods
    jest.spyOn(RpcService.prototype, 'estimateFeeInLamports').mockResolvedValue(BigInt(1000000000)); // 1 SOL

    // Mock the fetch function to throw an error
    global.fetch = jest.fn(() => Promise.reject(new Error('Fetch error'))) as jest.Mock;

    await expect(getFeeForSplTokenTransfer(mintSymbol)).rejects.toThrow('Fetch error');
  });

  it('should throw an error for invalid SOL to USD rate', async () => {
    const mintSymbol = 'USDC';
    if (!(mintSymbol in supportedMints)) {
      throw new Error('USDC is not a supported mint symbol');
    }

    // Mock the RpcService methods
    jest.spyOn(RpcService.prototype, 'estimateFeeInLamports').mockResolvedValue(BigInt(1000000000)); // 1 SOL

    // Mock the fetch function to return an invalid USD rate for Solana
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ solana: { usd: 'invalid' } }),
      })
    ) as jest.Mock;

    await expect(getFeeForSplTokenTransfer(mintSymbol)).rejects.toThrow('coingecko returned an invalid SOL to USD rate');
  });
});
