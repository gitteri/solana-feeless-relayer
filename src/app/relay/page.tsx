'use client';

import '@dialectlabs/blinks/index.css';

import { Blink, useAction } from "@dialectlabs/blinks";
import { useActionSolanaWalletAdapter } from "@dialectlabs/blinks/hooks/solana"
import { useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

// needs to be wrapped with <WalletProvider /> and <WalletModalProvider />
export default function Relay() {
  const actionApiUrl = 'http://localhost:3000/api/v1/actions/transfer';
  const { connection } = useConnection();
  const { adapter } = useActionSolanaWalletAdapter(connection.rpcEndpoint);
  const { action, isLoading } = useAction({url: actionApiUrl});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading || !action || !adapter) {
    return <div>Loading...</div>;
  }

  return <div className="min-w-[400px]"><Blink securityLevel="all" action={action} adapter={adapter} /></div>;
}
