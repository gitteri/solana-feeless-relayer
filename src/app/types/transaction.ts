
export type Transaction = {
  id: string;
  referenceId?: string;
  requestedByIp?: string;
  amount: string;
  mint: string;
  mintSymbol: string;
  destination: string;
  sender: string;
  feeInLamports?: string;
  feeInSpl?: string;
  unsignedTransactionBytes?: string;
  signedTransactionBytes?: string;
  currentStatus: TransactionStatus;
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

