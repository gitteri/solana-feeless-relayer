import { PublicKey } from "@solana/web3.js";

// Check if wallet.publicKey is defined and has the toBase58 method
export const validatePublicKey = (publicKey: PublicKey): boolean => {
  if (!publicKey || typeof publicKey.toBase58 !== 'function') {
    return false
  }
  return true
}