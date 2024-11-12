import { Keypair, PublicKey } from '@solana/web3.js';
import { RpcService } from './rpcService';
import { getMintInfo } from '@/app/config/mint';

describe('RpcService', () => {
  let rpcService: RpcService;
  const USDC_MINT = getMintInfo('USDC').address;
  const DUMMY_ADDRESS = '11111111111111111111111111111111';

  beforeAll(() => {
    rpcService = new RpcService();
  });

  afterEach(() => {    
    jest.restoreAllMocks();
  });

  describe('getSplBalance', () => {
    it('should return the SPL token balance for a given public key and mint', async () => {
      // Mock the RpcService methods
      jest.spyOn(rpcService.connection, 'getAccountInfo').mockResolvedValue({
        data: Buffer.from([]),
        executable: false,
        lamports: 0,
        owner: new PublicKey(DUMMY_ADDRESS),
        rentEpoch: 0,
      });
      jest.spyOn(rpcService.connection, 'getTokenAccountBalance').mockResolvedValue({
        context: { slot: 123 },
        value: {
          amount: '1000000',
          decimals: 6,
          uiAmount: 1,
          uiAmountString: '1',
        },
      });

      const balance = await rpcService.getSplBalance(DUMMY_ADDRESS, USDC_MINT);
      expect(balance).toBe('1');
    });

    it('should return 0 if the token account balance is initialized but 0', async () => {
      // Mock the RpcService methods
      jest.spyOn(rpcService.connection, 'getAccountInfo').mockResolvedValue({
        data: Buffer.from([]),
        executable: false,
        lamports: 0,
        owner: new PublicKey(DUMMY_ADDRESS),
        rentEpoch: 0,
      });
      jest.spyOn(rpcService.connection, 'getTokenAccountBalance').mockResolvedValue({
        context: { slot: 123 },
        value: {
          amount: '0',
          decimals: 6,
          uiAmount: null,
          uiAmountString: '0',
        },
      });

      const balance = await rpcService.getSplBalance(DUMMY_ADDRESS, USDC_MINT);
      expect(balance).toBe('0');
    });

    it('should throw an error if there is an issue fetching the SPL balance', async () => {
      // Mock the RpcService methods to throw an error
      jest.spyOn(rpcService.connection, 'getAccountInfo').mockResolvedValue({
        data: Buffer.from([]),
        executable: false,
        lamports: 0,
        owner: new PublicKey(DUMMY_ADDRESS),
        rentEpoch: 0,
      });
      jest.spyOn(rpcService.connection, 'getTokenAccountBalance').mockRejectedValue(new Error('RPC error'));

      await expect(rpcService.getSplBalance(DUMMY_ADDRESS, USDC_MINT)).rejects.toThrow('RPC error');
    });

    it('should return the real SPL token balance for a given public key and mint using the real RPC server', async () => {
      if (process.env.NODE_PROCESS !== 'ci') {
        const keypair = Keypair.generate();
        const REAL_PUBLIC_KEY = keypair.publicKey.toBase58();

        const balance = await rpcService.getSplBalance(REAL_PUBLIC_KEY, USDC_MINT);
        console.log('Debug: real SPL token balance:', balance);
        expect(typeof balance).toBe('string');
        expect(balance).toBe('0');
      }
    });
  });
});
