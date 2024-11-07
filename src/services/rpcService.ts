import {
  Connection,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
} from '@solana/spl-token';
import { validatePublicKey } from '@/utils/publicKey';
import { getMintInfo } from '@/app/config/mint';

const DEFAULT_DEVNET_RPC_ENDPOINT = 'https://api.devnet.solana.com';
const DEFAULT_MAINNET_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
export const TOKEN_PROGRAM_ADDRESS = TOKEN_PROGRAM_ID.toBase58();
export const TOKEN_2022_PROGRAM_ADDRESS = TOKEN_2022_PROGRAM_ID.toBase58();

/**
 * RpcService: A class for interacting with the Solana RPC
 * It provides methods to get the connection to the Solana RPC, airdrop SOL, get SOL and SPL balances,
 * get transaction history, and perform various token operations like transfer, compress, and decompress.
 */
export class RpcService {
  public connection: Connection;

  constructor(api_key: string = process.env.NEXT_PUBLIC_SOLANA_RPC_API_KEY || '', endpoint: string = DEFAULT_DEVNET_RPC_ENDPOINT) {
    this.connection = this.getConnection(api_key, endpoint);
  }

  /**
   * Get a connection to the Solana RPC
   * @param {string} api_key - The Solana RPC API key
   * @param {string} endpoint - The endpoint to connect to (default: DEVNET_RPC_ENDPOINT)
   * @returns {Connection} A connection to the Solana RPC
   */
  getConnection(api_key: string, endpoint: string = DEFAULT_DEVNET_RPC_ENDPOINT): Connection {
    const RPC_ENDPOINT = `${endpoint}/${api_key}`;
    const connection = new Connection(RPC_ENDPOINT);
    console.log("Debug: connection to", RPC_ENDPOINT, "created");
    return connection;
  }

  /**
   * Airdrop SOL to a given public key
   * @param {PublicKey} publicKey - The public key to receive the airdrop
   * @param {number} amount - The amount of SOL to airdrop (default: 1)
   * @returns {Promise<string>} The transaction signature
   */
  async airdropSolana(publicKey: PublicKey, amount: number = 1): Promise<string> {
    try {
      if (!validatePublicKey(publicKey)) {
        return '';
      }

      const lamports = amount * 1e9;
      const signature = await this.connection.requestAirdrop(publicKey, lamports);
      const latestBlockhash = await this.connection.getLatestBlockhash();
      await this.connection.confirmTransaction({
        signature,
        ...latestBlockhash
      });
      console.log(`Debug: Successfully airdropped ${amount} SOL to ${publicKey.toBase58()}`);
      return signature;
    } catch (error) {
      console.error("Error airdropping SOL:", error);
      throw error;
    }
  }

  /**
   * Get the SOL balance for a given public key
   * @param {PublicKey} publicKey - The public key to check the balance for
   * @returns {Promise<bigint>} The SOL balance as a bigint
   */
  async getSolBalance(publicKey: PublicKey): Promise<bigint> {
    try {
      if (!validatePublicKey(publicKey)) {
        return BigInt(0);
      }

      console.log("Debug: getting SOL balance for", publicKey.toBase58());
      const balance = await this.connection.getBalance(publicKey);
      if (balance === 0) {
        console.warn(`Debug: SOL balance for ${publicKey.toBase58()} is 0`);
        return BigInt(0);
      }
      console.log(`Debug: SOL balance for ${publicKey.toBase58()} is ${balance / 1e9} SOL`);
      return BigInt(balance);
    } catch (error) {
      console.error("Error fetching SOL balance:", error);
      throw error;
    }
  }

  /**
   * Get the SPL token balance for a given public key and mint
   * @param {PublicKey} publicKey - The public key to check the balance for
   * @param {PublicKey} mint - The SPL token mint
   * @param {PublicKey} programId - The SPL token program ID (default: TOKEN_PROGRAM_ID)
   * @returns {Promise<string>} The SPL token balance as a string
   */
  async getSplBalance(publicKey: PublicKey, mint: PublicKey, programId = TOKEN_PROGRAM_ID): Promise<string> {
    const ata = getAssociatedTokenAddressSync(publicKey, mint, true, programId);
    try {
      const info = await this.connection.getAccountInfo(ata);
      if (info === null) {
        return '0';
      }
      const tokenAccountBalance = await this.connection.getTokenAccountBalance(ata);
      const balance = tokenAccountBalance.value.uiAmountString;
      if (balance === undefined) {
        return '0';
      }
      return balance;
    } catch (error) {
      console.debug("Debug: error fetching SPL balance:", error);
      if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
        return '0';
      }
      throw error;
    }
  }

  /**
   * Get the highest recent priority fee
   * @returns {Promise<number>} The highest recent priority fee in microLamports
   */
  async getHighestRecentPriorityFee(): Promise<number> {
    try {
      const recentFees = await this.connection.getRecentPrioritizationFees();
      if (recentFees.length === 0) {
        throw new Error('No recent prioritization fees found');
      }
      const highestFee = Math.max(...recentFees.map(fee => fee.prioritizationFee));
      return highestFee;
    } catch (error) {
      console.error("Error fetching recent prioritization fees:", error);
      throw error;
    }
  }

  /**
   * Estimate the fee for a transaction
   * @param {string} mintSymbol - The mint symbol to estimate the fee for
   * @returns {Promise<bigint>} The fee in lamports
   */
  async estimateFeeInLamports(mintSymbol: string): Promise<bigint> {
    const mint = getMintInfo(mintSymbol);
    const rpcService = new RpcService();

    const computeUnits = 200_000;
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnits,
    });

    const highestRecentPriorityFee = await this.getHighestRecentPriorityFee();
    console.debug("Debug: Highest recent priority fee is", highestRecentPriorityFee, "microLamports");

    const microLamportsPerLamport = BigInt(1_000_000);
    const totalPriorityFee = BigInt(highestRecentPriorityFee) * BigInt(computeUnits) / microLamportsPerLamport;

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: highestRecentPriorityFee,
    });

    const dummyPublicKey = new PublicKey('11111111111111111111111111111111');

    // Create a dummy SPL token transfer transaction to estimate the fee
    const transaction = new Transaction().add(
      modifyComputeUnits,
      addPriorityFee,
      createTransferCheckedInstruction(
        dummyPublicKey, // fromTokenAccount
        new PublicKey(mint.address),
        dummyPublicKey, // toTokenAccount
        dummyPublicKey, // owner
        1, // Minimal amount for transfer
        mint.decimals,
        undefined,
        TOKEN_PROGRAM_ID, // TODO: support token 2022
      )
    );
    transaction.feePayer = dummyPublicKey;

    const { blockhash } = await rpcService.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    const fee = await rpcService.connection.getFeeForMessage(transaction.compileMessage(), 'confirmed');
    console.debug("Debug: estimated fee for a basic SPL transfer is", fee, "lamports");

    if (fee === null || typeof fee.value !== 'number') {
      throw new Error('Failed to get fee for the transaction');
    }

    return BigInt(fee.value) + totalPriorityFee;
  }
}
