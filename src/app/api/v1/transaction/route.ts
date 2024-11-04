import { NextApiRequest, NextApiResponse } from 'next';
import { validatePublicKeyString } from '@/utils/publicKey';
import { validate, v4 as uuidv4 } from 'uuid';
import { createTransaction, getTransaction } from '@/logic/transactionLogic';
import { Transaction, TransactionStatus, transactionStatuses } from '@/app/types/transaction';
import { supportedMints } from '@/app/config/mint';

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
const validateCreateTransactionRequest = (req: CreateTransactionRequest): { error: string } | null => {
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
const convertCreateTransactionRequestToTransaction = (req: CreateTransactionRequest): Transaction => {
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


interface GetTransactionRequest extends NextApiRequest {
  query: {
    id: string;
  };
}

interface CreateTransactionRequest extends NextApiRequest {
  body: {
    referenceId?: string;
    amount: string;
    mintSymbol: string;
    destination: string;
    sender: string;
  };
}

interface TransactionResponse extends NextApiResponse {
  json: (body: PublicTransaction | { error: string }) => void;
}

const validateGetTransactionRequest = (req: GetTransactionRequest): { error: string } | null => {
  const { id } = req.query;
  if (!id) {
    return { error: 'Transaction ID is required' };
  }
  if (!validate(id)) {
    return { error: 'Invalid Transaction ID format' };
  }
  return null;
}

// Handle GET requests to retrieve a transaction by ID
export async function GET(req: GetTransactionRequest, res: TransactionResponse) {
  const validationError = validateGetTransactionRequest(req);
  if (validationError) {
    return res.status(400).json(validationError);
  }
  const transaction = await getTransaction(req.query.id);
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  return res.status(200).json(transactionToPublicTransaction(transaction));
};

// Handle POST requests to create a new transaction
export async function POST(req: CreateTransactionRequest, res: TransactionResponse) {
  const validationError = validateCreateTransactionRequest(req);
  if (validationError) {
    return res.status(400).json(validationError);
  }

  const transaction = convertCreateTransactionRequestToTransaction(req);
  const newTransaction = await createTransaction(transaction);

  return res.status(201).json(newTransaction);
};
