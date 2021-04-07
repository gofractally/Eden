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
    const authorization = [
        {
            actor: authorizerAccount,
            permission: "active",
        },
    ];

    return {
        actions: [
            {
                account: atomicAssets.contract,
                name: "createtempl",
                authorization,
                data: {
                    authorized_creator: authorizerAccount,
                    collection_name: atomicAssets.collection,
                    schema_name: atomicAssets.schema,
                    transferable: true,
                    burnable: true,
                    max_supply: maxSupply,
                    immutable_data: [
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
                        {
                            key: "social",
                            value: ["string", nft.social],
                        },
                    ],
                },
            },
        ],
    };
};
