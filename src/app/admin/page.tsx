'use client'

import { useState, useEffect } from 'react'
import { AppHero } from '@/components/ui/ui-layout'
import Link from 'next/link'
import { stringToUiString } from '@/utils/balances'

const fetchRelayerData = async () => {
  const [walletResponse, statsResponse] = await Promise.all([
    fetch('/api/v1/wallet'),
    fetch('/api/v1/transfer/stats')
  ]);

  const walletData = await walletResponse.json();
  const statsData = await statsResponse.json();

  if (!walletData || !statsData || walletData.error || statsData.error) {
    console.error('Failed to fetch relayer data');
  }

  return {
    accountBalances: walletData,
    feesAccumulated: statsData.feesAccumulated,
    feesSpent: statsData.feesSpent,
    requestedTransfers: statsData.requestedTransfers,
    completedTransfers: statsData.completedTransfers,
  };

}

export default function AdminPage() {
  const [relayerData, setRelayerData] = useState({
    accountBalances: [{
      token: 'SOL',
      balance: '0',
    },
    {
      token: 'USDC',
      balance: '0',
    }, 
  {
      token: 'PYUSD',
      balance: '0',
    }],
    feesAccumulated: 0,
    feesSpent: 0,
    requestedTransfers: 0,
    completedTransfers: 0,
  })

  useEffect(() => {
    const getData = async () => {
      const data = await fetchRelayerData()
      setRelayerData(data)
    }
    getData()
  }, [])

  return (
    <div>
      <AppHero title="Admin Dashboard" subtitle="Overview of relayer activity and statistics" />
      <div className="p-4">
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">Relayer Account Balances</h2>
            {relayerData.accountBalances.map((balance) => (
              <p key={balance.token}>{balance.token}: {balance.balance}</p>
            ))}
          </div>
        </div>
        <div className="card mt-4">
          <div className="card-body">
            <h2 className="card-title">Relayer Activity Statistics</h2>
            <p>SPL Fees Accumulated: {stringToUiString(relayerData.feesAccumulated.toString(), 6)}</p>
            <p>SOL Fees Spent: {stringToUiString(relayerData.feesSpent.toString(), 9)}</p>
            <p>Requested Transfers: {relayerData.requestedTransfers}</p>
            <p>Completed Transfers: {relayerData.completedTransfers}</p>
            <p><Link href="/admin/transfers">View Transfers</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
