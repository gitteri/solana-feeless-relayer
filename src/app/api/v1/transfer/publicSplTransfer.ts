import { SplTransfer, TransactionStatus } from '@/app/types/splTransfer';

// This type is used to return the transaction to the client.
// It is used to hide certain fields from the public and to convert the amount to a string.
export type PublicSplTransfer = Omit<SplTransfer, 'signedTransactionBytes' | 'requestedByIp' | 'amount' | 'estimatedFeeInLamports' | 'feeInLamports' | 'feeInSpl'> & {
  currentStatus: TransactionStatus;
  amount: string;
  estimatedFeeInLamports: string;
  feeInLamports: string;
  feeInSpl: string;
};

// Convert a SplTransfer object to a PublicSplTransfer object
export const splTransferToPublicSplTransfer = (splTransfer: SplTransfer): PublicSplTransfer => {
  return {
    ...splTransfer,
    amount: splTransfer.amount.toString(),
    estimatedFeeInLamports: splTransfer.estimatedFeeInLamports ? splTransfer.estimatedFeeInLamports.toString() : '0',
    feeInLamports: splTransfer.feeInLamports ? splTransfer.feeInLamports.toString() : '0',
    feeInSpl: splTransfer.feeInSpl ? splTransfer.feeInSpl.toString() : '0',
    currentStatus: splTransfer.currentStatus as TransactionStatus,
  };
};