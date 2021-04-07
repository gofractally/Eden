import { atomicAssets } from "config";

import { EdenNftData } from "./interfaces";

export const demoTransaction = (
    authorizerAccount: string,
    to: string,
    quantity: string,
    memo: string
) => ({
    actions: [
        {
            account: "eosio.token",
            name: "transfer",
            authorization: [
                {
                    actor: authorizerAccount,
                    permission: "active",
                },
            ],
            data: {
                from: authorizerAccount, // use account that was logged in
                to: to,
                quantity: quantity, // "1.00000000 WAX",
                memo: memo,
            },
        },
    ],
});

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
