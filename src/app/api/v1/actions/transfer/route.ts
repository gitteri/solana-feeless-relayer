'use server';

import { NextRequest, NextResponse } from 'next/server';
import { ActionGetResponse, ActionPostRequest, ActionPostResponse, createActionHeaders } from '@solana/actions';
import { getMintInfo } from '@/app/config/mint';
import { createSplTransfer } from '@/logic/transactionEngine';
import { validatePublicKeyString } from '@/utils/publicKey';

// create the standard headers for this route (including CORS)
const headers = createActionHeaders({ chainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1', actionVersion: '2.1.3' });

// Validate the request body for creating a new SPL transfer
const validateCreateSplTransferRequest = async (req: NextRequest): Promise<{ error: string } | { sender: string, destination: string, amount: string, mintSymbol: string }> => {
  if (!req.url) {
    return { error: 'Request URL is required' };
  }
  const requestUrl = new URL(req.url);

  const { account }: ActionPostRequest = await req.json();
  if (!validatePublicKeyString(account)) {
    return { error: 'Invalid sender public key' };
  }
  const destination = requestUrl.searchParams.get('destination');
  if (!destination || !validatePublicKeyString(destination)) {
    return { error: 'Invalid destination public key' };
  }
  const amount = requestUrl.searchParams.get('amount');
  if (!amount || typeof amount !== 'string' || isNaN(Number(amount))) {
    return { error: 'Invalid amount' };
  }
  const mintSymbol = requestUrl.searchParams.get('mintSymbol');
  try {
    if (!mintSymbol) {
      return { error: 'Mint symbol is required' };
    }
    getMintInfo(mintSymbol);
  } catch (error) {
    return { error: 'Unsupported token' };
  }

  return {
    sender: account,
    destination,
    amount,
    mintSymbol,
  };
}

export const OPTIONS = GET;

// Handle GET requests to retrieve the action for creating a new SPL transfer
export async function GET(req: NextRequest, res: NextResponse<ActionGetResponse | { error: string }>) {  
    if (!req.url) {
    return NextResponse.json({ error: 'Request URL is required' }, { status: 400 });
  }

  const requestUrl = new URL(req.url);
  console.log('requestUrl', requestUrl);
  const baseHref = new URL(
    'api/v1/actions/transfer',
    requestUrl.origin,
  ).toString();


  const payload: ActionGetResponse = {
    type: "action",
    title: "Token Transfer Without SOL",
    icon: new URL("/relay.jpeg", requestUrl.origin).toString(),
    description: "Transfer a token to another Solana wallet without needing SOL in your wallet",
    label: "Transfer", // this value will be ignored since `links.actions` exists
    links: {
      actions: [
        {
          type: "transaction",
          label: "Send USDC", // button text
          href: `${baseHref}?mintSymbol=USDC&amount={amount}&destination={destination}`, // this href will have a text input
          parameters: [
            {
              name: "amount", // parameter name in the `href` above
              label: "Enter the amount of USDC to send", // placeholder of the text input
              required: true,
              pattern: "^[0-9]*\\.?[0-9]+$", // allow for decimals
              patternDescription: "Must be a number",
              min: 0.01, // allow for decimals
            },
            {
              name: "destination", // parameter name in the `href` above
              label: "Enter the destination Solana wallet address", // placeholder of the text input
              pattern: "^[a-zA-Z0-9]{32,44}$",
              patternDescription: "Must be a valid Solana wallet address",
              required: true,
            },
          ],
        },
        {
          type: "transaction",
          label: "Send PYUSD", // button text
          href: `${baseHref}?mintSymbol=PYUSD&amount={amount}&destination={destination}`, // this href will have a text input
          parameters: [
            {
              name: "amount", // parameter name in the `href` above
              type: "number",
              label: "Enter the amount of PYUSD to send", // placeholder of the text input
              pattern: "^[0-9]*\\.?[0-9]+$", // allow for decimals
              patternDescription: "Must be a number",
              required: true,
              min: 0.01, // allow for decimals
            },
            {
              name: "destination", // parameter name in the `href` above
              type: "text",
              label: "Enter the destination Solana wallet address", // placeholder of the text input
              pattern: "^[a-zA-Z0-9]{32,44}$",
              patternDescription: "Must be a valid Solana wallet address",
              required: true,
            },
          ],
        },
        // TODO: allow for custom token
      ],
    },
  };

  return NextResponse.json(payload, { headers });
};

// Handle POST requests to create a new transaction
export async function POST(req: NextRequest, res: NextResponse<ActionPostResponse | { error: string }>) {
  console.debug('transfer request POST received');

  const validationResult = await validateCreateSplTransferRequest(req);
  if ('error' in validationResult) {
    return NextResponse.json({ error: validationResult.error }, { status: 400 });
  }

  const { sender, destination, amount, mintSymbol } = validationResult;

  try {
    const splTransferRecord = await createSplTransfer(sender, destination, amount, mintSymbol);

    return NextResponse.json({
        type: 'transaction',
        message: `Send ${amount} to ${destination}`,
        transaction: splTransferRecord.unsignedTransactionBytes,
    }, { headers });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('error', errorMessage);
    return NextResponse.json({ 
      error: `Failed to create transaction: ${errorMessage}` 
    }, { status: 500 });
  }
};

