import { Decimal } from 'decimal.js';


export type SplTransfer = {
  id: string;
  signature?: string;
  referenceId?: string;
  requestedByIp?: string;
  amount: Decimal;
  mint: string;
  mintSymbol: string;
  destination: string;
  sender: string;
  feePayer: string;
  estimatedFeeInLamports?: bigint;
  feeInLamports?: bigint;
  feeInSpl?: bigint;
  unsignedTransactionBytes: Buffer;
  signedTransactionBytes?: Buffer;
  currentStatus: TransactionStatus;
  slot?: number;
  timestampIncluded?: Date;
  createdAt?: Date;
  statuses?: TransactionStatusHistory[];
};

export type TransactionStatusHistory = {
  id: number;
  status: TransactionStatus;
  createdAt: Date;
};

export const transactionStatuses = {
  INIT: 'init',
  SIGNING: 'signing',
  BROADCAST: 'broadcast',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;
export type TransactionStatus = typeof transactionStatuses[keyof typeof transactionStatuses];

