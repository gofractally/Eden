import { atomicAssets } from "config";

import { EdenNftData } from "./interfaces";

export const edenNftCreationTransaction = (
    authorizerAccount: string,
    nft: EdenNftData,
    maxSupply: number
) => {
    const immutable_data = [
        {
            key: "name",
            value: ["string", nft.name],
        },
        {
            key: "img",
            value: ["string", nft.img],
        },
        {
            key: "edenacc",
            value: ["string", nft.edenacc],
        },
        {
            key: "bio",
            value: ["string", nft.bio],
        },
        {
            key: "inductionvid",
            value: ["string", nft.inductionvid],
        },
    ];
    if (nft.social) {
        immutable_data.push({
            key: "social",
            value: ["string", nft.social],
        });
    }

    return {
        actions: [
            {
                account: atomicAssets.contract,
                name: "createtempl",
                authorization: activeAccountAuthorization(authorizerAccount),
                data: {
                    authorized_creator: authorizerAccount,
                    collection_name: atomicAssets.collection,
                    schema_name: atomicAssets.schema,
                    transferable: true,
                    burnable: true,
                    max_supply: maxSupply,
                    immutable_data,
                },
            },
        ],
    };
};

export const edenNftMintTransaction = (
    authorizerAccount: string,
    template_id: number,
    owners: string[]
) => {
    return {
        actions: owners.map((new_asset_owner) => ({
            account: atomicAssets.contract,
            name: "mintasset",
            authorization: activeAccountAuthorization(authorizerAccount),
            data: {
                authorized_minter: authorizerAccount,
                collection_name: atomicAssets.collection,
                schema_name: atomicAssets.schema,
                template_id,
                new_asset_owner,
                immutable_data: [],
                mutable_data: [],
                tokens_to_back: [],
            },
        })),
    };
};

const activeAccountAuthorization = (account: string) => [
    {
        actor: account,
        permission: "active",
    },
];

/* Auction

auctioning dan
[
  {
    "account": "atomicmarket",
    "name": "announceauct",
    "authorization": [
      {
        "actor": "edenmembers1",
        "permission": "active"
      }
    ],
    "data": {
      "seller": "edenmembers1",
      "asset_ids": [
        "1099513503173"
      ],
      "starting_bid": "10.00000000 WAX",
      "duration": 604800,
      "maker_marketplace": ""
    }
  },
  {
    "account": "atomicassets",
    "name": "transfer",
    "authorization": [
      {
        "actor": "edenmembers1",
        "permission": "active"
      }
    ],
    "data": {
      "from": "edenmembers1",
      "to": "atomicmarket",
      "asset_ids": [
        "1099513503173"
      ],
      "memo": "auction"
    }
  }
]


auctioning captomega
[
  {
    "account": "atomicmarket",
    "name": "announceauct",
    "authorization": [
      {
        "actor": "edenmembers1",
        "permission": "active"
      }
    ],
    "data": {
      "seller": "edenmembers1",
      "asset_ids": [
        "1099513503181"
      ],
      "starting_bid": "10.00000000 WAX",
      "duration": 604800,
      "maker_marketplace": ""
    }
  },
  {
    "account": "atomicassets",
    "name": "transfer",
    "authorization": [
      {
        "actor": "edenmembers1",
        "permission": "active"
      }
    ],
    "data": {
      "from": "edenmembers1",
      "to": "atomicmarket",
      "asset_ids": [
        "1099513503181"
      ],
      "memo": "auction"
    }
  }
]


------------------- placing a bid
[
  {
    "account": "eosio.token",
    "name": "transfer",
    "authorization": [
      {
        "actor": "edtcaptomega",
        "permission": "active"
      }
    ],
    "data": {
      "from": "edtcaptomega",
      "to": "atomicmarket",
      "quantity": "12.59782000 WAX",
      "memo": "deposit"
    }
  },
  {
    "account": "atomicmarket",
    "name": "auctionbid",
    "authorization": [
      {
        "actor": "edtcaptomega",
        "permission": "active"
      }
    ],
    "data": {
      "bidder": "edtcaptomega",
      "auction_id": 14,
      "bid": "12.59782000 WAX",
      "taker_marketplace": ""
    }
  }
]
*/
