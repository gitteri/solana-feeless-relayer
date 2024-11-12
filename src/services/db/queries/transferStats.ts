
import { prisma } from '../index';

export async function getFeesAccumulated(): Promise<bigint> {
  try {
    const result = await prisma.splTransfer.aggregate({
      _sum: {
        feeInSpl: true,
      },
      where: {
        statuses: {
          some: {
            status: 'confirmed',
          },
        },
      },
    });
    return BigInt(result._sum.feeInSpl || 0);
  } catch (error) {
    console.error('Failed to fetch fees accumulated', error);
    throw error;
  }
}

export async function getFeesSpent(): Promise<bigint> {
  try {
    const result = await prisma.splTransfer.aggregate({
      _sum: {
        feeInLamports: true,
      },
      where: {
        statuses: {
          some: {
            status: 'confirmed',
          },
        },
      },
    });
    return BigInt(result._sum.feeInLamports || 0);
  } catch (error) {
    console.error('Failed to fetch fees spent', error);
    throw error;
  }
}

export async function getRequestedTransfers(): Promise<number> {
  try {
    const result = await prisma.splTransfer.count();
    return result || 0;
  } catch (error) {
    console.error('Failed to fetch requested transfers', error);
    throw error;
  }
}

export async function getCompletedTransfers(): Promise<number> {
  try {
    const result = await prisma.splTransfer.count({
      where: {
        statuses: {
          some: {
            status: 'confirmed',
          },
        },
      },
    });
    return result || 0;
  } catch (error) {
    console.error('Failed to fetch completed transfers', error);
    throw error;
  }
}
