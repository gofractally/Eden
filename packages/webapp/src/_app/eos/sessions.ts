import dayjs from "dayjs";
import { generateKeyPair, sha256 } from "eosjs/dist/eosjs-key-conversions";
import { KeyType } from "eosjs/dist/eosjs-numeric";
import { PrivateKey } from "eosjs/dist/eosjs-jssig";
import { hexToUint8Array, SerialBuffer } from "eosjs/dist/eosjs-serialize";
import { get as idbGet, set as idbSet } from "idb-keyval";
import { SessionSignRequest } from "@edenos/common";

import { edenContractAccount, box } from "config";
import { eosDefaultApi, eosJsonRpc } from "_app";

const DEFAULT_EXPIRATION_SECONDS = 30 * 24 * 60 * 60; // 30 days
const DEFAULT_SESSION_DESCRIPTION = "eden login";

interface SessionKeyData {
    publicKey: string;
    privateKey: string;
    expiration: Date;
    lastSequence: number;
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

    async advanceSequence() {
        const data = await this.getKey();
        if (!data) {
            throw new Error(
                "Unable to advance sequence on missing session key"
            );
        }

        data.lastSequence += 1;
        await this.saveKey(data);

        return data.lastSequence;
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
        lastSequence: 0,
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

export const signAndBroadcastSessionTransaction = async (
    authorizerAccount: string,
    actions: any[]
) => {
    const signedSessionTrx = await signSessionTransaction(
        authorizerAccount,
        actions
    );
    console.info("generated signedSessionTrx trx", signedSessionTrx);

    const broadcastedRunTrx = await eosJsonRpc.send_transaction({
        signatures: signedSessionTrx.signatures,
        serializedTransaction: hexToUint8Array(signedSessionTrx.packed_trx),
    });
    console.info("broadcasted run trx >>>", broadcastedRunTrx);

    await sessionKeysStorage.advanceSequence();

    return broadcastedRunTrx;
};

export const signSessionTransaction = async (
    authorizerAccount: string,
    actions: any[]
) => {
    const sessionKey = await sessionKeysStorage.getKey();
    if (!sessionKey) {
        throw new Error("Session key is not present");
    }

    const sequence = sessionKey.lastSequence + 1;
    const verbs = convertActionsToVerbs(actions);

    const signatureAuthSha = await makeSignatureAuthSha(
        edenContractAccount,
        authorizerAccount,
        sequence,
        verbs
    );

    const signature = await signSha(sessionKey, signatureAuthSha);

    const data: SessionSignRequest = {
        signature: signature.toString(),
        edenAccount: authorizerAccount,
        sequence,
        verbs,
    };
    const response = await fetch(`${box.address}/v1/sessions/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response.json();
};

const makeSignatureAuthSha = async (
    contract: string,
    account: string,
    sequence: number,
    verbs: any[]
) => {
    const signatureAuthBytes = await serializeSignatureAuth(
        contract,
        account,
        sequence,
        verbs
    );
    return sha256(Buffer.from(signatureAuthBytes));
};

const convertActionsToVerbs = (actions: any[]) =>
    actions.map((action) => [action.name, action.data]);

const serializeSignatureAuth = async (
    contract: string,
    account: string,
    sequence: number,
    verbs: any[]
): Promise<Uint8Array> => {
    const contractAbi = await eosDefaultApi.getContract(contract);
    const verbType = contractAbi.types.get("verb");
    if (!verbType) {
        throw new Error("abi has no verb definition");
    }
    const buffer = new SerialBuffer({
        textEncoder: eosDefaultApi.textEncoder,
        textDecoder: eosDefaultApi.textDecoder,
    });
    buffer.pushName(contract);
    buffer.pushName(account);
    buffer.pushVaruint32(sequence);
    buffer.pushVaruint32(verbs.length);
    verbs.forEach((verb) => verbType.serialize(buffer, verb));

    return buffer.asUint8Array();
};

const signSha = (sessionKey: SessionKeyData, sha: number[]) => {
    const privateKey = PrivateKey.fromString(sessionKey.privateKey);
    return privateKey.sign(sha, false);
};
