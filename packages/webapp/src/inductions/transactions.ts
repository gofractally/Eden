import { SerialBuffer } from "eosjs/dist/eosjs-serialize";
import {
    assetToString,
    hash256EosjsSerialBuffer,
    primaryKeyFromAccountInstant,
    serializeType,
} from "_app";
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

export const submitEndorsementTransaction = async (
    authorizerAccount: string,
    induction: Induction
) => {
    const buffer = new SerialBuffer();
    buffer.pushString(induction.video);
    await serializeType(
        edenContractAccount,
        "new_member_profile",
        buffer,
        induction.new_member_profile
    );
    const inductionDataHash = hash256EosjsSerialBuffer(buffer);

    return {
        actions: [
            {
                account: edenContractAccount,
                name: "inductendorse",
                authorization: [
                    {
                        actor: authorizerAccount,
                        permission: "active",
                    },
                ],
                data: {
                    account: authorizerAccount,
                    id: induction.id,
                    induction_data_hash: inductionDataHash,
                },
            },
        ],
    };
};

export const donateAndCompleteInductionTransaction = (
    authorizerAccount: string,
    induction: Induction
) => {
    const quantity = assetToString(
        minimumDonationAmount,
        minimumDonationAmount.precision
    );

    return {
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
                    quantity,
                    memo: "induction-donation",
                },
            },
            {
                account: edenContractAccount,
                name: "inductpayfee",
                authorization: [
                    {
                        actor: authorizerAccount,
                        permission: "active",
                    },
                ],
                data: {
                    payer: authorizerAccount,
                    id: induction.id,
                    quantity,
                },
            },
        ],
    };
};
