import { NextApiRequest, NextApiResponse } from 'next';
import { validate, v4 as uuidv4 } from 'uuid';
import { supportedMints } from '@/app/config/mint';
import { Transaction, TransactionStatus, transactionStatuses } from '@/app/types/transaction';
import { createTransaction, getTransaction } from '@/logic/transactionLogic';
import { validatePublicKeyString } from '@/utils/publicKey';

// This type is used to return the transaction to the client.
// It is used to hide certain fields from the public.
export type PublicTransaction = Omit<Transaction, 'signedTransactionBytes' | 'requestedByIp'> & {
  currentStatus: TransactionStatus;
};

// Convert a Transaction object to a PublicTransaction object
const transactionToPublicTransaction = (transaction: Transaction): PublicTransaction => {
  return {
    ...transaction,
    currentStatus: transaction.currentStatus as TransactionStatus,
  };
};

// Validate the request body for creating a new transaction
const validateCreateTransactionRequest = (req: NextApiRequest): { error: string } | null => {
  const { referenceId, amount, mintSymbol, destination, sender } = req.body;
  if (!validatePublicKeyString(destination)) {
    return { error: 'Invalid destination public key' };
  }
  if (!validatePublicKeyString(sender)) {
    return { error: 'Invalid sender public key' };
  }
  // referenceId is optional but should be an alphanumeric string
  if (referenceId && !/^[a-zA-Z0-9]+$/.test(referenceId)) {
    return { error: 'Invalid reference ID' };
  }
  // amount should be a float string
  if (typeof amount !== 'string' || isNaN(Number(amount))) {
    return { error: 'Invalid amount' };
  }
  if (!mintSymbol || typeof mintSymbol !== 'string' || !(mintSymbol in supportedMints)) {
    return { error: 'Unsupported token' };
  }

  return null;
}

// Convert the request body to a Transaction object
const convertCreateTransactionRequestToTransaction = (req: NextApiRequest): Transaction => {
  const { referenceId, amount, mintSymbol, destination, sender } = req.body;
  const mint = supportedMints[mintSymbol as keyof typeof supportedMints];
  const id = uuidv4();
  return {
    id,
    referenceId,
    amount,
    mint,
    mintSymbol,
    destination,
    sender,
    feeInLamports: '0',
    feeInSpl: '0',
    currentStatus: transactionStatuses.INIT,
  };
}

const validateGetTransactionRequest = (id?: any): { error: string } | null => {
  if (!id) {
    return { error: 'Transaction ID is required' };
  }
  if (typeof id !== 'string') {
    return { error: 'Transaction ID must be a string' };
  }
  if (!validate(id)) {
    return { error: 'Invalid Transaction ID format' };
  }
  return null;
}

// Handle GET requests to retrieve a transaction by ID
export async function GET(req: NextApiRequest, res: NextApiResponse<PublicTransaction | { error: string }>) {
  const { id } = req.query;
  const validationError = validateGetTransactionRequest(id);
  if (validationError) {
    return res.status(400).json(validationError);
  }

  const transaction = await getTransaction(id as string);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  return res.status(200).json(transactionToPublicTransaction(transaction));
};

// Handle POST requests to create a new transaction
export async function POST(req: NextApiRequest, res: NextApiResponse<PublicTransaction | { error: string }>) {
  const validationError = validateCreateTransactionRequest(req);
  if (validationError) {
    return res.status(400).json(validationError);
  }

  const transaction = convertCreateTransactionRequestToTransaction(req);

  const newTransaction = await createTransaction(transaction);
  if (!newTransaction) {
    return res.status(500).json({ error: 'Failed to create transaction' });
  }

  return res.status(201).json(transactionToPublicTransaction(newTransaction));
};
