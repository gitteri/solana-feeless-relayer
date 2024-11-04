import {
    Connection,
    PublicKey,
  } from '@solana/web3.js';
  import {
    TOKEN_PROGRAM_ID,
  } from '@solana/spl-token';
  import { BN } from '@coral-xyz/anchor';
  import { validatePublicKey } from '@/utils/publicKey';
  
  // Define constants for network types
  export const DEVNET = 'devnet' as const;
  export const MAINNET = 'mainnet' as const;
  export type Network = typeof DEVNET | typeof MAINNET;
  
  /**
   * Get the network from environment variables
   * @returns {Network} The network type (DEVNET or MAINNET)
   */
  export const getNetworkFromEnv = (): Network => {
    const network = process.env.NEXT_PUBLIC_NETWORK as Network;
    if (![DEVNET, MAINNET].includes(network)) {
      console.warn(`Invalid network value provided: ${network}. Defaulting to ${DEVNET}.`);
      return DEVNET;
    }
    return network;
  }
  
  /**
   * RpcService: A class for interacting with the Helius API for Solana blockchain operations
   * It provides methods to get the connection to the Helius RPC, airdrop SOL, get SOL and SPL balances,
   * get transaction history, and perform various token operations like transfer, compress, and decompress.
   */
  export class RpcService {
    public connection: Connection;
    public network: string;
  
    constructor(api_key: string, network: string = DEVNET) {
      this.connection = this.getConnection(api_key, network);
      this.network = network;
    }
  
    /**
     * Get a connection to the Helius API
     * @param {string} api_key - The Helius API key
     * @param {string} network - The network to connect to (default: DEVNET)
     * @returns {Connection} A connection to the Helius API
     */
    getConnection(api_key: string, network: string = DEVNET): Connection {
      if (!api_key) {
        api_key = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
      }
      // Note: you can replace helius with any other RPC provider as desired
      const RPC_ENDPOINT = `https://${network}.helius-rpc.com?api-key=${api_key}`;
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
     * @returns {Promise<BN>} The SOL balance as a BN
     */
    async getSolBalance(publicKey: PublicKey): Promise<BN> {
      try {
        if (!validatePublicKey(publicKey)) {
          return new BN(0);
        }
  
        console.log("Debug: getting SOL balance for", publicKey.toBase58());
        const balance = await this.connection.getBalance(publicKey);
        if (balance === 0) {
          console.warn(`Debug: SOL balance for ${publicKey.toBase58()} is 0`);
          return new BN(0);
        }
        console.log(`Debug: SOL balance for ${publicKey.toBase58()} is ${balance / 1e9} SOL`);
        return new BN(balance);
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
     * @returns {Promise<BN>} The SPL token balance as a BN
     */
    async getSplBalance(publicKey: PublicKey, mint: PublicKey, programId = TOKEN_PROGRAM_ID): Promise<BN> {
      try {
        const pk = new PublicKey(publicKey);
        if (!validatePublicKey(pk)) {
          return new BN(0);
        }
  
        console.log("getting spl balance", mint);
        const response = await this.connection.getTokenAccountsByOwner(
          pk,
          {
            mint: mint,
            programId: programId
          }
        );
  
        if (response.value.length === 0) {
          console.log("No token account found for this wallet");
          return new BN(0);
        }
  
        const tokenAccountInfo = response.value[0].account.data;
        const balance = new BN(tokenAccountInfo.subarray(64, 72), 'le');
  
        console.log("Debug: SPL balance for", pk.toBase58(), "is", balance.toString());
  
        return balance;
      } catch (error) {
        console.error("Error fetching SPL balance:", error);
        throw error;
      }
    }
  }
  