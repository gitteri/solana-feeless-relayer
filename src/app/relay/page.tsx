'use client';

import '@dialectlabs/blinks/index.css';

import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Blink, useAction } from "@dialectlabs/blinks";
import { useActionSolanaWalletAdapter } from "@dialectlabs/blinks/hooks/solana"

// needs to be wrapped with <WalletProvider /> and <WalletModalProvider />
export default function Relay() {
  const actionApiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/v1/actions/transfer` : '';
  const { connection } = useConnection();
  const { adapter } = useActionSolanaWalletAdapter(connection.rpcEndpoint);
  const { action, isLoading } = useAction({ url: actionApiUrl });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || isLoading || !action || !adapter) {
    return <div>Loading...</div>;
  }

  return <div className="min-w-[400px]"><Blink securityLevel="all" action={action} adapter={adapter} /></div>;
}
