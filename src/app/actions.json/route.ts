import { createActionHeaders, type ActionsJson } from "@solana/actions";

export const GET = async () => {
  const payload: ActionsJson = {
    rules: [
    // I don't think we need this:
    //   // map all root level routes to an action
    //   {
    //     pathPattern: "/*",
    //     apiPath: "/api/v1/actions/*",
    //   },
    //   // idempotent rule as the fallback
      {
        pathPattern: "/api/v1/actions/**",
        apiPath: "/api/v1/actions/**",
      },
    ],
  };

  return Response.json(payload, {
    headers: createActionHeaders(),
  });
};

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// THIS WILL ENSURE CORS WORKS FOR BLINKS
export const OPTIONS = GET;