import { edenContractAccount, minimumDonationAmount } from "config";
import { assetToString } from "_app";

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
