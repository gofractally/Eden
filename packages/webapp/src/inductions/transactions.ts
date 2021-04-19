import { assetToString, primaryKeyFromAccountInstant } from "_app";
import { edenContractAccount, minimumDonationAmount } from "config";

import { Induction, NewMemberProfile } from "./interfaces";

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

export const setInductionVideoTransaction = (
    authorizerAccount: string,
    id: string,
    video: string
) => {
    return {
        actions: [
            {
                account: edenContractAccount,
                name: "inductvideo",
                authorization: [
                    {
                        actor: authorizerAccount,
                        permission: "active",
                    },
                ],
                data: {
                    account: authorizerAccount,
                    id,
                    video,
                },
            },
        ],
    };
};

export const submitEndorsementTransaction = (
    authorizerAccount: string,
    induction: Induction
) => {
    return {
        actions: [
            {
                account: edenContractAccount,
                name: "inductendors",
                authorization: [
                    {
                        actor: authorizerAccount,
                        permission: "active",
                    },
                ],
                data: {
                    account: authorizerAccount,
                    id: induction.id,
                    video: induction.video,
                    new_member_profile: induction.new_member_profile,
                },
            },
        ],
    };
};
