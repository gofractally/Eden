import dayjs from "dayjs";
import { generateKeyPair } from "eosjs/dist/eosjs-key-conversions";
import { KeyType } from "eosjs/dist/eosjs-numeric";
import { PublicKey, PrivateKey } from "eosjs/dist/eosjs-jssig";
import { get as idbGet, set as idbSet } from "idb-keyval";

import { edenContractAccount } from "config";
import { eosDefaultApi } from "_app";

const DEFAULT_EXPIRATION_SECONDS = 24 * 60 * 60 * 1000; // 30 days
const DEFAULT_SESSION_DESCRIPTION = "eden login";

interface SessionKeyData {
    publicKey: string;
    privateKey: string;
    expiration: Date;
}

class SessionKeysStorage {
    constructor(public storageKey = "sessionKeys") {}

    async getKey() {
        const data: SessionKeyData | undefined = await idbGet(this.storageKey);
        return data;
    }

    async saveKey(keyData: SessionKeyData) {
        return idbSet(this.storageKey, keyData);
    }
}
export const sessionKeysStorage = new SessionKeysStorage();

export const generateSessionKey = async (
    expirationSeconds = DEFAULT_EXPIRATION_SECONDS
) => {
    // TODO: to be replaced with SubtleCrypto Apis
    const { publicKey, privateKey } = generateKeyPair(KeyType.r1, {
        secureEnv: true,
    });

    const expiration = dayjs().add(expirationSeconds, "seconds").toDate();

    return {
        publicKey: publicKey.toString(),
        privateKey: privateKey.toString(),
        expiration,
    };
};

export const newSessionTransaction = async (
    authorizerAccount: string,
    sessionKeyData: SessionKeyData,
    description = DEFAULT_SESSION_DESCRIPTION
) => {
    const key = sessionKeyData.publicKey;
    const expiration =
        sessionKeyData.expiration.toISOString().slice(0, -4) + "000";

    return {
        actions: [
            {
                account: edenContractAccount,
                name: "newsession",
                authorization: [
                    {
                        actor: authorizerAccount,
                        permission: "active",
                    },
                ],
                data: {
                    eden_account: authorizerAccount,
                    key,
                    expiration,
                    description,
                },
            },
        ],
    };
};

export const executeSessionTransaction = async (
    authorizerAccount: string,
    actions: any[]
) => {
    const sessionKey = await sessionKeysStorage.getKey();
    console.info("preparing session execution with sessionKey", sessionKey);

    console.info(authorizerAccount, actions);

    const serializedActionsData = await eosDefaultApi.serializeActions(actions);
    console.info("serialized actions data >>>", serializedActionsData);
};
