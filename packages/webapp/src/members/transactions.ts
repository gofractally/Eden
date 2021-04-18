import { edenContractAccount, minimumDonationAmount } from "config";
import { assetToString } from "_app";
import { pkFromAccountInstant } from "./utils";

export const donationTransaction = (authorizerAccount: string) => ({
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
                from: authorizerAccount,
                to: edenContractAccount,
                quantity: assetToString(
                    minimumDonationAmount,
                    minimumDonationAmount.precision
                ),
                memo: "donation",
            },
        },
    ],
});

export const initializeInductionTransaction = (
    authorizerAccount: string,
    invitee: string,
    witnesses: string[]
) => {
    const id = pkFromAccountInstant(authorizerAccount);
    return {
        id,
        transaction: {
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
                        id,
                        inviter: authorizerAccount,
                        invitee,
                        witnesses,
                    },
                },
            ],
        },
    };
};
