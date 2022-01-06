import dayjs from "dayjs";
import { generateKeyPair } from "eosjs/dist/eosjs-key-conversions";
import {
    Key,
    KeyType,
    publicKeyToString,
    signatureToString,
} from "eosjs/dist/eosjs-numeric";
import { PrivateKey } from "eosjs/dist/eosjs-jssig";
import { Signature } from "eosjs/dist/Signature";
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
    publicKey: string;
    privateKey: string;
    expiration: Date;
    lastSequence: number;
    subtleKey?: CryptoKeyPair;
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

    const subtleKey = await crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        false, // not extractable
        ["sign", "verify"]
    );

    const expiration = dayjs().add(expirationSeconds, "seconds").toDate();

    return {
        publicKey: publicKey.toString(),
        privateKey: privateKey.toString(),
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
    let key = sessionKeyData.publicKey;

    if (sessionKeyData.subtleKey?.publicKey) {
        const subtlePubKey = sessionKeyData.subtleKey.publicKey;
        const eosKey = await subtleToEosPublicKey(subtlePubKey);
        console.info("subtle eos pubkey >>>", eosKey);
        key = publicKeyToString(eosKey);
    }

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
    // return sha256(Buffer.from(signatureAuthBytes));
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
    const privateKey = PrivateKey.fromString(sessionKey.privateKey);
    const signature = privateKey.sign(data, true);
    console.info("eos signature >>>", signature, signature.toString());

    if (sessionKey.subtleKey?.privateKey) {
        console.info("i will sign with subtle >>>", sessionKey.subtleKey);

        const privateKey = sessionKey.subtleKey.privateKey;
        const signature = await crypto.subtle.sign(
            { name: "ECDSA", hash: "SHA-256" },
            privateKey,
            data
        );
        const signatureBytes = new Uint8Array(signature);

        const eosPubKey = await subtleToEosPublicKey(
            sessionKey.subtleKey.publicKey!
        );

        const pubKey = EC.keyFromPublic(
            eosPubKey.data.subarray(0, 33)
        ).getPublic();
        const hash = new Uint8Array(
            await crypto.subtle.digest("SHA-256", data)
        );

        // const ecSignature = {
        //     r: signatureBytes.slice(0, 32),
        //     s: signatureBytes.slice(32, 64),
        // };

        const r = signatureBytes.slice(0, 32);
        const s = signatureBytes.slice(32, 64);

        const flippedS: BN = EC.n.sub(new BN(s));
        const flippedSBytes = new Uint8Array(flippedS.toArray());

        console.info(
            "s vs flipped s >>> ",
            s,
            flippedSBytes,
            flippedS.toString()
        );

        const ecSignature = {
            r,
            s: flippedSBytes,
        };

        console.info(ecSignature, eosPubKey, pubKey, hash, signatureBytes);
        const recid = EC.getKeyRecoveryParam(hash, ecSignature, pubKey);
        const recidByte = 27 + 4 + recid; // <<<--- still presenting failures

        // let recId = 31;

        const sigDataWithRecovery = {
            type: KeyType.r1,
            data: new Uint8Array(
                [recidByte].concat(Array.from(r), Array.from(flippedSBytes))
            ),
        };
        console.info(
            "signature from subtle",
            recidByte,
            signatureBytes,
            signature,
            sigDataWithRecovery,
            signatureToString(sigDataWithRecovery)
        );
        return signatureToString(sigDataWithRecovery);

        // const sessionPubKeyString = publicKeyToString(eosPubKey);
        // let signatureStr = signatureToString(sigDataWithRecovery);
        // let signatureEcObj = Signature.fromString(signatureStr);
        // let recoveredKey = signatureEcObj.recover(data, true).toString();

        // console.info(
        //     "recoveredKey >>>",
        //     recoveredKey.toString(),
        //     sessionPubKeyString
        // );

        // if (recoveredKey.toString() === sessionPubKeyString) {
        //     return signatureStr;
        // }

        // recId += 1;
        // sigDataWithRecovery.data[0] = recId;
        // signatureStr = signatureToString(sigDataWithRecovery);
        // signatureEcObj = Signature.fromString(signatureStr);
        // recoveredKey = signatureEcObj.recover(data, true).toString();

        // console.info(
        //     "recoveredKey 2 >>>",
        //     recoveredKey.toString(),
        //     sessionPubKeyString
        // );

        // return signatureStr;
    }
    return signature.toString();
};

const subtleToEosPublicKey = async (
    subtlePublicKey: CryptoKey
): Promise<Key> => {
    const rawKey = await crypto.subtle.exportKey("raw", subtlePublicKey);
    const x = new Uint8Array(rawKey.slice(1, 33));
    const y = new Uint8Array(rawKey.slice(33, 65));
    console.info("raw data pubkey >>>", rawKey, x, y);
    const data = new Uint8Array([y[31] & 1 ? 3 : 2].concat(Array.from(x)));
    const key = { type: KeyType.r1, data };
    console.info("subtle to eoskey >>>", key);
    return key;
};

function toDER(pr: number[], ps: number[]) {
    let r = [...pr];
    let s = [...ps];

    // Pad values
    if (r[0] & 0x80) r = [0].concat(r);
    // Pad values
    if (s[0] & 0x80) s = [0].concat(s);

    r = rmPadding(r);
    s = rmPadding(s);

    while (!s[0] && !(s[1] & 0x80)) {
        s = s.slice(1);
    }
    var arr = [0x02];
    constructLength(arr, r.length);
    arr = arr.concat(r);
    arr.push(0x02);
    constructLength(arr, s.length);
    var backHalf = arr.concat(s);
    var res = [0x30];
    constructLength(res, backHalf.length);
    res = res.concat(backHalf);
    return res;
}

function rmPadding(buf: number[]) {
    var i = 0;
    var len = buf.length - 1;
    while (!buf[i] && !(buf[i + 1] & 0x80) && i < len) {
        i++;
    }
    if (i === 0) {
        return buf;
    }
    return buf.slice(i);
}

function constructLength(arr: number[], len: number) {
    if (len < 0x80) {
        arr.push(len);
        return;
    }
    var octets = 1 + ((Math.log(len) / Math.LN2) >>> 3);
    arr.push(octets | 0x80);
    while (--octets) {
        arr.push((len >>> (octets << 3)) & 0xff);
    }
    arr.push(len);
}
