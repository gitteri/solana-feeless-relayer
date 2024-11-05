import { SplTransfer, TransactionStatus } from '@/app/types/splTransfer';
import { prisma } from '../index';

// This is a collection of functions that are used to interact with the transactions table in the database.
// This will likely be updated as the project evolves.

// Function to get all transactions
export const getAllSplTransfers = async () => {
    return await prisma.splTransfer.findMany();
};

// Function to get a transaction by ID
export const getSplTransferById = async (id: string): Promise<SplTransfer | null> => {
    const dbTransaction = await prisma.splTransfer.findUnique({
        where: { id },
        include: {
            statuses: {
                orderBy: {
                    createdAt: 'desc',
                },
            },
        },
    });
    if (!dbTransaction) {
        return null;
    }
    return {
        ...dbTransaction,
        referenceId: dbTransaction.referenceId ?? undefined,
        requestedByIp: dbTransaction.requestedByIp ?? undefined,
        signedTransactionBytes: dbTransaction.signedTransactionBytes ?? undefined,
        currentStatus: dbTransaction.statuses[dbTransaction.statuses.length - 1].status as TransactionStatus,
        statuses: dbTransaction.statuses.map(status => ({
            ...status,
            status: status.status as TransactionStatus
        }))
    };
};

// Function to create a new transaction
export const createSplTransfer = async (data: SplTransfer) => {
    if (!data.unsignedTransactionBytes) {
        throw new Error('unsignedTransactionBytes is required');
    }
    if (!data.feeInLamports) {
        throw new Error('feeInLamports is required');
    }
    if (!data.feeInSpl) {
        throw new Error('feeInSpl is required');
    }
    
    await prisma.splTransfer.create({
        data: {
            id: data.id,
            referenceId: data.referenceId,
            requestedByIp: data.requestedByIp,
            amount: data.amount,
            mint: data.mint,
            mintSymbol: data.mintSymbol,
            destination: data.destination,
            sender: data.sender,
            feeInLamports: data.feeInLamports,
            feeInSpl: data.feeInSpl,
            unsignedTransactionBytes: data.unsignedTransactionBytes,
            statuses: {
                create: [{
                    status: data.currentStatus,
                    createdAt: new Date(),
                }]
            }
        }
    });

    return data;
};
