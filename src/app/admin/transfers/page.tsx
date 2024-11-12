'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import { PublicSplTransfer } from '@/app/api/v1/transfer/[id]/route';

export default function RelayerPage() {
  const [transfers, setTransfers] = useState<PublicSplTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(20);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>(null);
  const [hasMore, setHasMore] = useState(true);

  async function fetchTransfers(newOffset = 0, fetchLimit = limit) {
    try {
      const response = await fetch(`/api/v1/transfer?offset=${newOffset}&limit=${fetchLimit}`);
      const data = await response.json();
      if (newOffset === 0) {
        setTransfers(data);
      } else {
        setTransfers((prevTransfers) => [...prevTransfers, ...data]);
      }
      if (data.length < fetchLimit) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to fetch transfers', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransfers(0, offset + limit);
    const interval = setInterval(() => fetchTransfers(0, offset + limit), 5000); // Refresh all data every 5 seconds
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [fetchTransfers, offset, limit]);

  useEffect(() => {
    if (offset > 0) {
      fetchTransfers(offset);
    }
  }, [fetchTransfers, offset]);

  const sortedTransfers = useMemo(() => {
    let sortableTransfers = [...transfers];
    if (sortConfig !== null) {
      sortableTransfers.sort((a, b) => {
        const key = sortConfig.key as keyof PublicSplTransfer;
        if (a[key] !== undefined && b[key] !== undefined) {
          if (a[key] < b[key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (a[key] > b[key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
        }
        return 0;
      });
    }
    return sortableTransfers;
  }, [transfers, sortConfig]);

  const requestSort = (key: string) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const ellipsify = (str: string, len: number = 4) => {
    if (str.length > 30) {
      return str.substring(0, len) + '..' + str.substring(str.length - len, str.length);
    }
    return str;
  };

  const loadMoreTransfers = () => {
    setLoading(true);
    setOffset((prevOffset) => prevOffset + limit);
  };

  return (
    <div className="container mx-auto p-6 min-h-screen">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-gray-800 dark:text-gray-200">Recent SPL Transfers</h1>
      {loading && transfers.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
            <table className="table-auto w-full">
              <thead className="bg-gray-200 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('sender')}>Sender &#x2195;</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('destination')}>Destination &#x2195;</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('amount')}>Amount &#x2195;</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('currentStatus')}>Status &#x2195;</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('createdAt')}>Date &#x2195;</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{ellipsify(transfer.sender)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{ellipsify(transfer.destination)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{transfer.amount.toString()} {transfer.mintSymbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{transfer.currentStatus}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{transfer.createdAt ? new Date(transfer.createdAt).toLocaleString() : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      <Link href={`/admin/transfers/${transfer.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-500">View Transaction</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="flex justify-center mt-4">
              <button onClick={loadMoreTransfers} className="btn btn-primary" disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
      <Toaster position="bottom-right" />
    </div>
  );
}
