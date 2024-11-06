export interface MintInfo {
  address: string;
  decimals: number;
}

// TODO: move this to a config file and make it work for mainnet
const supportedMints: Record<string, MintInfo> = {
  'USDC': {
    address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // devnet
    decimals: 6,
  },
};

export const getMintInfo = (mintSymbol?: string): MintInfo => {
  if (!mintSymbol || !(mintSymbol in supportedMints)) {
    throw new Error('Unsupported mint symbol');
  }
  return supportedMints[mintSymbol];
};
