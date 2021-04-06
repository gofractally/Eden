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
