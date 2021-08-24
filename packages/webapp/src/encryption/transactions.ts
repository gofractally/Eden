import { edenContractAccount } from "config";

export const setEncryptionPublicKeyTransaction = (
    authorizerAccount: string,
    encryptionPublicKey: string
) => ({
    actions: [
        {
            account: edenContractAccount,
            name: "setencpubkey",
            authorization: [
                {
                    actor: authorizerAccount,
                    permission: "active",
                },
            ],
            data: {
                account: authorizerAccount,
                key: encryptionPublicKey,
            },
        },
    ],
});
