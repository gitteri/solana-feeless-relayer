import { getTransactionById, createTransaction as createTransactionInDb } from '@/services/db/queries/transactions';
import { Transaction } from '@/app/types/transaction';

export async function getTransaction(id: string): Promise<Transaction | null> {
  return await getTransactionById(id);
}

export async function createTransaction(transaction: Transaction): Promise<Transaction | null> {
  // TODO: get and set the current fee
  // TODO: generate the transaction bytes
  return await createTransactionInDb(transaction);
}
