import { edenContractAccount } from "config";

import { PublicKey } from "eosjs/dist/PublicKey";

export const setEncryptionPublicKeyTransaction = (
    authorizerAccount: string,
    encryptionPublicKey: PublicKey
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
                key: encryptionPublicKey.toLegacyString(),
            },
        },
    ],
});
