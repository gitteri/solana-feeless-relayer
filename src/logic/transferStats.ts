import { getFeesAccumulated, getFeesSpent, getRequestedTransfers, getCompletedTransfers } from '@/services/db/queries/transferStats';

export async function getTransferStats(): Promise<{ feesAccumulated: string; feesSpent: string; requestedTransfers: number; completedTransfers: number; }> {
  try {
    const [feesAccumulated, feesSpent, requestedTransfers, completedTransfers] = await Promise.all([
      getFeesAccumulated(),
      getFeesSpent(),
      getRequestedTransfers(),
      getCompletedTransfers()
    ]);

    return {
      feesAccumulated: feesAccumulated.toString(),
      feesSpent: feesSpent.toString(),
      requestedTransfers,
      completedTransfers,
    };
  } catch (error) {
    console.error('Failed to fetch transfer stats', error);
    throw error;
  }
}
