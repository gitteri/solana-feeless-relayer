'use server';

import { NextRequest, NextResponse } from 'next/server';
import { ActionGetResponse, ActionPostRequest, ActionPostResponse, createActionHeaders, createPostResponse } from '@solana/actions';
import { supportedMints } from '@/app/config/mint';
import { createSplTransfer } from '@/logic/transactionLogic';
import { validatePublicKeyString } from '@/utils/publicKey';
import { VersionedTransaction } from '@solana/web3.js';


// create the standard headers for this route (including CORS)
const headers = createActionHeaders();

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

export const OPTIONS = GET;

// Handle GET requests to retrieve the action for creating a new SPL transfer
export async function GET(req: NextRequest, res: NextResponse<ActionGetResponse | { error: string }>) {  
    if (!req.url) {
    return NextResponse.json({ error: 'Request URL is required' }, { status: 400 });
  }

  const requestUrl = new URL(req.url);

  const baseHref = new URL(
    'api/v1/actions/transfer',
    requestUrl.origin,
  ).toString();


  const payload: ActionGetResponse = {
    type: "action",
    title: "Token Transfer Without SOL",
    icon: new URL("/logo.jpeg", requestUrl.origin).toString(),
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

  return NextResponse.json(payload, { headers });
};

// Handle POST requests to create a new transaction
export async function POST(req: NextRequest, res: NextResponse<ActionPostResponse | { error: string }>) {

  const validationResult = await validateCreateSplTransferRequest(req);
  if ('error' in validationResult) {
    return NextResponse.json({ error: validationResult.error }, { status: 400 });
  }

  const { sender, destination, amount, mintSymbol } = validationResult;

  try {
    const splTransferRecord = await createSplTransfer(sender, destination, amount, mintSymbol);

    const payload: ActionPostResponse = await createPostResponse({
        fields: {
          type: 'transaction',
          transaction: VersionedTransaction.deserialize(splTransferRecord.unsignedTransactionBytes),
          message: `Send ${amount} to ${destination}`,
        },
        // note: no additional signers are needed
        // signers: [],
      });
  
      return Response.json(payload, {
        headers,
      });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: `Failed to create transaction: ${errorMessage}` 
    }, { status: 500 });
  }
};

