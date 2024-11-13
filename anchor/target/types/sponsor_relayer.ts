/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sponsor_relayer.json`.
 */
export type SponsorRelayer = {
  "address": "5Gdnpj8THruSLpvAmP4x9V2YThPT633BiBa9vHvGyXBz",
  "metadata": {
    "name": "sponsorRelayer",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "authorizeRelayer",
      "discriminator": [
        164,
        158,
        129,
        204,
        201,
        28,
        143,
        11
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "sponsorship"
          ]
        },
        {
          "name": "relayer",
          "writable": true
        },
        {
          "name": "sponsorship",
          "relations": [
            "relayer"
          ]
        }
      ],
      "args": [
        {
          "name": "sponsorCap",
          "type": "u64"
        }
      ]
    },
    {
      "name": "blockRelayer",
      "discriminator": [
        111,
        206,
        180,
        12,
        163,
        90,
        168,
        72
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "sponsorship"
          ]
        },
        {
          "name": "relayer"
        },
        {
          "name": "sponsorship"
        }
      ],
      "args": []
    },
    {
      "name": "closeRelayer",
      "discriminator": [
        63,
        107,
        176,
        209,
        253,
        239,
        18,
        193
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "closeSponsorship",
      "discriminator": [
        48,
        49,
        37,
        139,
        2,
        175,
        255,
        161
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "sponsorship"
          ]
        },
        {
          "name": "sponsorship"
        }
      ],
      "args": []
    },
    {
      "name": "initializeRelayer",
      "discriminator": [
        145,
        167,
        151,
        150,
        126,
        228,
        236,
        207
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "relayer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "relayerWallet"
              }
            ]
          }
        },
        {
          "name": "sponsorship"
        },
        {
          "name": "relayerWallet"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeSponsorship",
      "discriminator": [
        116,
        246,
        140,
        95,
        48,
        27,
        84,
        48
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "sponsorship",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  112,
                  111,
                  110,
                  115,
                  111,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "maxPriorityFee",
          "type": "u64"
        },
        {
          "name": "allowPermissionlessRelayers",
          "type": "bool"
        },
        {
          "name": "mint",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "sponsorAmount",
          "type": "u64"
        },
        {
          "name": "fundRent",
          "type": "bool"
        }
      ]
    },
    {
      "name": "relay",
      "discriminator": [
        109,
        130,
        24,
        215,
        1,
        255,
        37,
        114
      ],
      "accounts": [
        {
          "name": "relayerWallet",
          "writable": true,
          "signer": true,
          "relations": [
            "relayer"
          ]
        },
        {
          "name": "relayer"
        },
        {
          "name": "sponsorship",
          "writable": true,
          "relations": [
            "relayer"
          ]
        },
        {
          "name": "instructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "relayer",
      "discriminator": [
        168,
        116,
        52,
        174,
        161,
        196,
        71,
        218
      ]
    },
    {
      "name": "sponsorship",
      "discriminator": [
        191,
        110,
        48,
        7,
        9,
        44,
        168,
        248
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidTipAccount",
      "msg": "Invalid tip account"
    },
    {
      "code": 6001,
      "name": "invalidMint",
      "msg": "Invalid mint"
    },
    {
      "code": 6002,
      "name": "invalidCloseAuthority",
      "msg": "Invalid close authority"
    },
    {
      "code": 6003,
      "name": "closeAuthorityNotSet",
      "msg": "Close authority not set"
    },
    {
      "code": 6004,
      "name": "invalidProgram",
      "msg": "Invalid program"
    },
    {
      "code": 6005,
      "name": "maxPriorityFeeExceeded",
      "msg": "Max priority fee exceeded"
    },
    {
      "code": 6006,
      "name": "attemptedToInitializeExistingAccount",
      "msg": "Attempted to initialize existing account"
    },
    {
      "code": 6007,
      "name": "multipleCalls",
      "msg": "Multiple calls in a single transaction"
    },
    {
      "code": 6008,
      "name": "invalidInstruction",
      "msg": "Invalid instruction"
    }
  ],
  "types": [
    {
      "name": "relayer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "sponsorship",
            "type": "pubkey"
          },
          {
            "name": "relayerWallet",
            "type": "pubkey"
          },
          {
            "name": "sponsorCap",
            "type": "u64"
          },
          {
            "name": "authorized",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sponsorship",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "maxPriorityFee",
            "type": "u64"
          },
          {
            "name": "allowPermissionlessRelayers",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "fundRent",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
