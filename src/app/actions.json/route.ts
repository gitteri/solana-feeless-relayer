import { createActionHeaders, type ActionsJson } from "@solana/actions";

export const GET = async () => {
  const payload: ActionsJson = {
    rules: [
      {
        pathPattern: "/api/v1/actions/**",
        apiPath: "/api/v1/actions/**",
      },
    ],
  };

  return Response.json(payload, {
    headers: createActionHeaders({ chainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1', actionVersion: '2.1.3' }),
  });
};

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// THIS WILL ENSURE CORS WORKS FOR BLINKS
export const OPTIONS = GET;