// import { SerialBuffer } from "eosjs/dist/eosjs-serialize";
import {
    assetToString,
    // hash256EosjsSerialBuffer,
    // primaryKeyFromAccountInstant,
    // serializeType,
} from "_app";
import { edenContractAccount, minimumDonationAmount } from "config";

// import { Induction, NewMemberProfile } from "./interfaces";

export const someTransaction = (authorizerAccount: string) => ({
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
