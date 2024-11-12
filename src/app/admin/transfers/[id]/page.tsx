'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Decimal from 'decimal.js';
import { PublicSplTransfer } from '@/app/api/v1/transfer/[id]/route';
import { ExplorerLink } from '@/components/cluster/cluster-ui';
import { Toaster, toast } from 'react-hot-toast';
import { ellipsify } from '@/components/ui/ui-layout';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getMintInfo } from '@/app/config/mint';

export default function RelayerDetailPage() {
  const { id } = useParams();
  const [transfer, setTransfer] = useState<PublicSplTransfer | null>(null);
  const [loading, setLoading] = useState(true);

  const mint = transfer?.mintSymbol ? getMintInfo(transfer.mintSymbol) : null;

  async function fetchTransfer() {
    try {
      const response = await fetch(`/api/v1/transfer/${id}`);
      const data = await response.json();
      setTransfer(data);
    } catch (error) {
      console.error('Failed to fetch transfer', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      fetchTransfer();
      const interval = setInterval(fetchTransfer, 3000); // Refresh every 3 seconds
      return () => clearInterval(interval); // Cleanup interval on component unmount
    }
  }, [id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-gray-800 dark:text-gray-200">SPL Transfer Details</h1>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : transfer ? (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Transaction ID</h2>
              <p className="text-gray-700 dark:text-gray-300">{transfer.id}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Sender</h2>
              <p className="text-gray-700 dark:text-gray-300" title={transfer.sender} onClick={() => copyToClipboard(transfer.sender)}>{ellipsify(transfer.sender)}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Destination</h2>
              <p className="text-gray-700 dark:text-gray-300" title={transfer.destination} onClick={() => copyToClipboard(transfer.destination)}>{ellipsify(transfer.destination)}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Amount</h2>
              <p className="text-gray-700 dark:text-gray-300">{transfer.amount.toString()} {transfer.mintSymbol || ''}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Status</h2>
              <p className="text-gray-700 dark:text-gray-300">{transfer.currentStatus}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Created At</h2>
              <p className="text-gray-700 dark:text-gray-300">{transfer.createdAt ? new Date(transfer.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Fee in SPL</h2>
              <p className="text-gray-700 dark:text-gray-300">{mint && transfer.feeInSpl ? (new Decimal(transfer.feeInSpl.toString()).mul(new Decimal(10).pow(-mint.decimals)).toFixed(mint.decimals)) : 'N/A'}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Fee in SOL</h2>
              <p className="text-gray-700 dark:text-gray-300">{transfer.feeInLamports ? (new Decimal(transfer.feeInLamports.toString()).div(LAMPORTS_PER_SOL).toFixed(8)) : 'N/A'}</p>
            </div>
            {transfer.estimatedFeeInLamports && (
              <div>
                <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Estimated Fee in SOL</h2>
                <p className="text-gray-700 dark:text-gray-300">{new Decimal(transfer.estimatedFeeInLamports.toString()).div(LAMPORTS_PER_SOL).toFixed(8)}</p>
              </div>
            )}
            {transfer.feePayer && (
              <div>
                <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Fee Payer</h2>
                <p className="text-gray-700 dark:text-gray-300" title={transfer.feePayer} onClick={() => copyToClipboard(transfer.feePayer)}>{ellipsify(transfer.feePayer)}</p>
              </div>
            )}
            {transfer.slot && (
              <div>
                <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Slot</h2>
                <p className="text-gray-700 dark:text-gray-300">{transfer.slot}</p>
              </div>
            )}
            {transfer.timestampIncluded && (
              <div>
                <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Timestamp</h2>
                <p className="text-gray-700 dark:text-gray-300">{new Date(transfer.timestampIncluded).toLocaleString()}</p>
              </div>
            )}
            {transfer.referenceId && (
              <div>
                <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Memo Reference ID</h2>
                <p className="text-gray-700 dark:text-gray-300">{transfer.referenceId}</p>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">Signature</h2>
              <p className="text-gray-700 dark:text-gray-300" title={transfer.signature || 'N/A'} onClick={() => copyToClipboard(transfer.signature || 'N/A')}>{ellipsify(transfer.signature || 'N/A')}</p>
            </div>
            {transfer.signature && (
              <div className="col-span-full">
                <ExplorerLink path={`tx/${transfer.signature}`} label={'View Transaction on Explorer'} className="btn btn-primary w-full" />
              </div>
            )}
            {transfer.statuses && transfer.statuses.length > 0 && (
              <div className="col-span-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Status History</h2>
                <ul className="list-none space-y-2">
                  {transfer.statuses.map((status) => (
                    <li key={status.status} className="flex items-center space-x-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">{new Date(status.createdAt).toLocaleString()}:</span>
                      <span className="text-gray-700 dark:text-gray-300">{status.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg text-gray-700 dark:text-gray-300">Transfer not found</p>
        </div>
      )}
      <Toaster position="bottom-right" />
    </div>
  );
}
