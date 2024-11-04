import { prisma } from '../index';

// This is a collection of functions that are used to interact with the transactions table in the database.
// This will likely be updated as the project evolves.

// Function to get all transactions
export const getAllTransactions = async () => {
  return await prisma.transaction.findMany();
};

// Function to get a transaction by ID
export const getTransactionById = async (id: string) => {
  return await prisma.transaction.findUnique({
    where: { id },
  });
};

// Function to create a new transaction
export const createTransaction = async (data: any) => {
  return await prisma.transaction.create({
    data,
  });
};

// Function to update a transaction by ID
export const updateTransaction = async (id: string, data: any) => {
  return await prisma.transaction.update({
    where: { id },
    data,
  });
};

// Function to delete a transaction by ID
export const deleteTransaction = async (id: string) => {
  return await prisma.transaction.delete({
    where: { id },
  });
};
