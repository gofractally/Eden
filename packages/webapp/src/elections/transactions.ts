import { edenContractAccount } from "config";
import { EncryptedKey } from "encryption";

export const setElectionMeeting = (
    authorizerAccount: string,
    round: number,
    keys: EncryptedKey[],
    data: Uint8Array,
    old_data?: Uint8Array
) => ({
    actions: [
        {
            account: edenContractAccount,
            name: "inductmeetin",
            authorization: [
                {
                    actor: authorizerAccount,
                    permission: "active",
                },
            ],
            data: {
                account: authorizerAccount,
                round,
                keys,
                data,
                old_data,
            },
        },
    ],
});

export const setElectionParticipation = (
    authorizerAccount: string,
    participating: boolean
) => ({
    actions: [
        {
            account: edenContractAccount,
            name: "electopt",
            authorization: [
                {
                    actor: authorizerAccount,
                    permission: "active",
                },
            ],
            data: {
                member: authorizerAccount,
                participating,
            },
        },
    ],
});
