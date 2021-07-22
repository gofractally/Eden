import { edenContractAccount } from "config";
import { EncryptedKey } from "encryption";

export const setElectionMeeting = (
    authorizerAccount: string,
    round: number,
    keys: EncryptedKey[],
    data: Uint8Array,
    old_data?: Uint8Array
) => {
    return {
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
    };
};
