import dayjs from "dayjs";
import {
    Key,
    KeyType,
    publicKeyToString,
    signatureToString,
} from "eosjs/dist/eosjs-numeric";
import { hexToUint8Array, SerialBuffer } from "eosjs/dist/eosjs-serialize";
import { get as idbGet, set as idbSet } from "idb-keyval";
import { SessionSignRequest } from "@edenos/common";
import { ec as elliptic } from "elliptic";
import BN from "bn.js";

import { edenContractAccount, box } from "config";
import { eosDefaultApi, eosJsonRpc } from "_app";

const EC = new elliptic("p256") as any;

const DEFAULT_EXPIRATION_SECONDS = 30 * 24 * 60 * 60; // 30 days
const DEFAULT_SESSION_DESCRIPTION = "eden login";

interface SessionKeyData {
    subtleKey: CryptoKeyPair;
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
    const subtleKey = await generateSubtleCryptoKeyPair();
    const expiration = dayjs().add(expirationSeconds, "seconds").toDate();
    return {
        subtleKey,
        lastSequence: 0,
        expiration,
    };
};

export const newSessionTransaction = async (
    authorizerAccount: string,
    sessionKeyData: SessionKeyData,
    description = DEFAULT_SESSION_DESCRIPTION
) => {
    const subtlePubKey = sessionKeyData.subtleKey.publicKey!;
    const eosKey = await subtleToEosPublicKey(subtlePubKey);
    const key = publicKeyToString(eosKey);

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

    const signatureAuthData = await makeSignatureAuthSha(
        edenContractAccount,
        authorizerAccount,
        sequence,
        verbs
    );

    const signature = await signData(sessionKey, signatureAuthData);

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

// Generates a Subtle Crypto EC P-256 R1 key
const generateSubtleCryptoKeyPair = () =>
    crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        false, // not extractable
        ["sign", "verify"]
    );

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
    return signatureAuthBytes;
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

const signData = async (
    sessionKey: SessionKeyData,
    data: Uint8Array
): Promise<string> => {
    const privateKey = sessionKey.subtleKey.privateKey!;
    const signature = await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        privateKey,
        data
    );
    const signatureBytes = new Uint8Array(signature);

    const eosPubKey = await subtleToEosPublicKey(
        sessionKey.subtleKey.publicKey!
    );

    const pubKey = EC.keyFromPublic(eosPubKey.data.subarray(0, 33)).getPublic();
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", data));

    const r = signatureBytes.slice(0, 32);
    let s = signatureBytes.slice(32, 64);
    const sBN = new BN(s);

    // flip s-value if bigger than half of curve n
    if (sBN.gt(EC.n.divn(2))) {
        const flippedS: BN = EC.n.sub(sBN);
        const flippedSBytes = new Uint8Array(flippedS.toArray());
        s = flippedSBytes;
    }

    const recId = 31 + EC.getKeyRecoveryParam(hash, { r, s }, pubKey);
    const sigDataWithRecovery = {
        type: KeyType.r1,
        data: new Uint8Array([recId].concat(Array.from(r), Array.from(s))),
    };
    return signatureToString(sigDataWithRecovery);
};

const subtleToEosPublicKey = async (
    subtlePublicKey: CryptoKey
): Promise<Key> => {
    const rawKey = await crypto.subtle.exportKey("raw", subtlePublicKey);
    const x = new Uint8Array(rawKey.slice(1, 33));
    const y = new Uint8Array(rawKey.slice(33, 65));
    const data = new Uint8Array([y[31] & 1 ? 3 : 2].concat(Array.from(x)));
    const key = { type: KeyType.r1, data };
    return key;
};
