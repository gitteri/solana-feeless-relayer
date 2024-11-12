// This file contains the configuration for the supported SPL tokens.
// It is used to get the address and decimals for a given mint symbol.

export const memoProgramId = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

export interface MintInfo {
  address: string;
  decimals: number;
}

// TODO: move this to a config file and make it work for mainnet
// these addresses are for devnet
export const supportedMints: Record<string, MintInfo> = {
  'USDC': {
    address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    decimals: 6,
  },
  'PYUSD': {
    address: 'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM',
    decimals: 6,
  },
};

export const getMintInfo = (mintSymbol?: string): MintInfo => {
  if (!mintSymbol || !(mintSymbol in supportedMints)) {
    throw new Error('Unsupported mint symbol');
  }
  return supportedMints[mintSymbol];
};
