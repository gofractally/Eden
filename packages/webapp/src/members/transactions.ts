import { edenContractAccount, minimumDonationAmount } from "config";
import { assetToString } from "_app";
import { NewMemberProfile } from "./interfaces";
import { primaryKeyFromAccountInstant } from "./utils";

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
    const id = primaryKeyFromAccountInstant(authorizerAccount);
    return {
        id,
        transaction: {
            actions: [
                {
                    account: edenContractAccount,
                    name: "inductinit",
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

export const setInductionProfileTransaction = (
    authorizerAccount: string,
    id: string,
    newMemberProfile: NewMemberProfile
) => {
    return {
        actions: [
            {
                account: edenContractAccount,
                name: "inductprofil",
                authorization: [
                    {
                        actor: authorizerAccount,
                        permission: "active",
                    },
                ],
                data: {
                    id,
                    new_member_profile: newMemberProfile,
                },
            },
        ],
    };
};

export const hiTransaction = (authorizerAccount: string) => {
    return {
        actions: [
            {
                account: edenContractAccount,
                name: "hi",
                authorization: [
                    {
                        actor: authorizerAccount,
                        permission: "active",
                    },
                ],
                data: {
                    user: "eosio.token",
                },
            },
        ],
    };
};
