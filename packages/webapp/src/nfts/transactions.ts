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

const ATOMIC_ASSETS_CONTRACT = "atomicassets";
const COLLECTION_NAME = "edenmembers1";
const SCHEMA_NAME = "edenmembers1";

export const edenNftCreationTransaction = (
    authorizerAccount: string,
    inductors: string[],
    name: string,
    img: string,
    edenacc: string,
    bio: string,
    inductionvid: string
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
                account: ATOMIC_ASSETS_CONTRACT,
                name: "createtempl",
                authorization,
                data: {
                    authorized_creator: authorizerAccount,
                    collection_name: COLLECTION_NAME,
                    schema_name: SCHEMA_NAME,
                    transferable: true,
                    burnable: true,
                    max_supply: inductors.length + 2,
                    immutable_data: [
                        {
                            key: "name",
                            value: ["string", name],
                        },
                        {
                            key: "img",
                            value: ["string", img],
                        },
                        {
                            key: "edenacc",
                            value: ["string", edenacc],
                        },
                        {
                            key: "bio",
                            value: ["string", bio],
                        },
                        {
                            key: "inductionvid",
                            value: ["string", inductionvid],
                        },
                    ],
                },
            },
        ],
    };
};
