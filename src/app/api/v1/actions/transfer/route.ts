'use server';

import { NextApiRequest, NextApiResponse } from 'next';
import { ActionGetResponse, ActionPostRequest, ActionPostResponse, createActionHeaders } from '@solana/actions';
import { supportedMints } from '@/app/config/mint';
import { createSplTransfer } from '@/logic/transactionLogic';
import { validatePublicKeyString } from '@/utils/publicKey';


// create the standard headers for this route (including CORS)
const headers = createActionHeaders();

// Validate the request body for creating a new transaction
const validateCreateTransactionRequest = (req: NextApiRequest): { error: string } | { sender: string, destination: string, amount: string, mintSymbol: string } => {
  if (!req.url) {
    return { error: 'Request URL is required' };
  }
  const requestUrl = new URL(req.url);

  const { account }: ActionPostRequest = req.body;
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
  if (!mintSymbol || typeof mintSymbol !== 'string' || !(mintSymbol in supportedMints)) {
    return { error: 'Unsupported token' };
  }

  return {
    sender: account,
    destination,
    amount,
    mintSymbol,
  };
}

// Handle GET requests to retrieve a transaction by ID
export async function GET(req: NextApiRequest, res: NextApiResponse<ActionGetResponse | { error: string }>) {
  if (!req.url) {
    return res.status(400).json({ error: 'Request URL is required' });
  }

  const requestUrl = new URL(req.url);

  const baseHref = new URL(
    'api/v1/actions/transfer',
    requestUrl.origin,
  ).toString();


  const payload: ActionGetResponse = {
    type: "action",
    title: "Token Transfer Without SOL",
    icon: new URL("/solana_devs.jpg", requestUrl.origin).toString(),
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
            },
            {
              name: "destination", // parameter name in the `href` above
              label: "Enter the destination Solana wallet address", // placeholder of the text input
              required: true,
            },
          ],
        },
        {
          type: "transaction",
          label: "Send USDT", // button text
          href: `${baseHref}?mintSymbol=USDT&amount={amount}&destination={destination}`, // this href will have a text input
          parameters: [
            {
              name: "amount", // parameter name in the `href` above
              label: "Enter the amount of USDT to send", // placeholder of the text input
              required: true,
            },
            {
              name: "destination", // parameter name in the `href` above
              label: "Enter the destination Solana wallet address", // placeholder of the text input
              required: true,
            },
          ],
        },
        // TODO: allow for custom token
      ],
    },
  };

  return res.status(200).setHeaders(new Headers(headers)).json(payload);
};

// Handle POST requests to create a new transaction
export async function POST(req: NextApiRequest, res: NextApiResponse<ActionPostResponse | { error: string }>) {
  const validationResult = validateCreateTransactionRequest(req);
  if ('error' in validationResult) {
    return res.status(400).json({ error: validationResult.error });
  }

  const { sender, destination, amount, mintSymbol } = validationResult;
  let signedTransactionBytes: string | null = null;
  try {
    const unsignedTransactionBytes = await createSplTransfer(sender, destination, amount, mintSymbol);

    // TODO: sign the transaction
    // const signedTransactionBytes = await signTransaction(unsignedTransactionBytes);
    signedTransactionBytes = unsignedTransactionBytes;
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
  if (!signedTransactionBytes) {
    return res.status(500).json({ error: 'Failed to create transaction' });
  }

  return res.status(200).setHeaders(new Headers(headers)).json({
    type: 'transaction',
    transaction: signedTransactionBytes,
  })
};

