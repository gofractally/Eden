/**
 * recipient_ecc_pubkey = eden.keys_table( where account = logged_in user )
check if recipient_ecc_pubkey matches browser

transient_ecc_pubkey = new pubkey (same curve as recipient_ecc_pubkey)

recipient_key1 = eden.keys_table( where account = recipient1 user )
recipient_key2 = eden.keys_table( where account = recipient2 user )
recipient_key3 = eden.keys_table( where account = recipient3 user )

// each recipient
key_encryption_key = HKDF-SHA256(ECDH(recipient_pubkey, transient_privkey))

session_key = random AES-128 key

// each recipient
encrypted_session_key = AES-KW(KEK_recipient, session key)

encrypted_link = AES-GCM(session_key, ZOOM_LINK)

eden.publishelection(
  publisher = logged_in_user
  round_no = '2',
  encrypted_link,
// for each recipient
  [(encrypted_session_keyN, recipient_keyN, transient_ecc_pubkey)]
)
 */

// import { generateKeyPair, PrivateKey, PublicKey } from "eosjs";
// // import {generateKeyPair, PrivateKey, PublicKey, sha256, Signature} from '../eosjs-key-conversions';
// import { KeyType } from "eosjs/dist/eosjs-numeric";
import ecc, { PrivateKey, PublicKey } from "eosjs-ecc";
const ec = require("elliptic").ec("secp256k1");
const bn = require("bn.js");

export const publishSecretToChain = async (
    message: string,
    publisherAccount: string,
    recipientAccounts: string[]
) => {
    const [publisherKey, ...recipientKeys] = await fetchRecipientKeys([
        publisherAccount,
        ...recipientAccounts,
    ]);
    console.info(publisherKey, recipientKeys);

    // TODO: check publisherkey matches the current one in browser

    const transientKeyPair = await generateRandomTransientKey();
    console.info(transientKeyPair);

    const keks = await ecdhRecipientsKeyEncriptionKeys(
        [publisherKey, ...recipientKeys],
        transientKeyPair.privateKey
    );
    console.info(keks);

    const sessionKey = await generateRandomSessionKey();
    console.info(sessionKey);

    const encryptedSessionKeys = await encryptSessionKeys(sessionKey, keks);
    console.info(encryptedSessionKeys);
    const encryptedMessage = await encryptMessage(sessionKey, message);
    console.info(encryptedMessage);

    const obj = {
        encryptedSessionKeys,
        recipientKeys,
        transientKeyPair,
        encryptedMessage,
    };
    console.info(obj);
    return obj;
};

const fetchRecipientKeys = async (accounts: string[]) => {
    // TODO: real implementation
    // fetch eden.keys_table( where account = each account item )

    const mockedKeysLen = accounts.length;
    const mockedKeys = [];
    for (let i = 0; i < mockedKeysLen; i++) {
        mockedKeys.push(
            "EOS5wGY8RcG8PuGYTPU9QwmiEm9XReBkK4SGtSuS4f1oeX4TNGaHT"
        );
        // temp PK: 5KcMypBPGByXbeBphsVzyyzUvg31tWNKsgrfXs2MmanYgYf4gao
    }
    return mockedKeys;
};

const generateRandomTransientKey = async () => {
    const privateKey = await ecc.randomKey();
    const publicKey = ecc.privateToPublic(privateKey);
    return { privateKey, publicKey };
};

const ecdhRecipientsKeyEncriptionKeys = async (
    recipientPublicKeys: string[],
    transientPrivateKeyString: string
) => {
    const transientPrivateKey = PrivateKey.fromString(
        transientPrivateKeyString
    );
    const transientEc = ec.keyPair({
        priv: new bn(transientPrivateKey.d.toHex(), 16),
    });
    return await Promise.all(
        recipientPublicKeys.map(async (publicKey: string) => {
            const recipientEcPublicKey = ec.keyFromPublic(
                PublicKey.fromString(publicKey).toHex(),
                "hex"
            );
            const ecdhSecret = transientEc.derive(
                recipientEcPublicKey.getPublic()
            );
            return await hkdfSha256FromEcdh(
                ecdhSecret.toArrayLike(ArrayBuffer) // TODO: review endianness, empty = Big Endian
            );
        })
    );
};

const hkdfSha256FromEcdh = async (ecdhSecret: ArrayBuffer) => {
    const sharedSecretKey = await crypto.subtle.importKey(
        "raw",
        ecdhSecret,
        { name: "HKDF" },
        false,
        ["deriveKey", "deriveBits"]
    );
    const derivedKey = await crypto.subtle.deriveBits(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: new Uint8Array([]),
            info: new Uint8Array([]),
        },
        sharedSecretKey,
        256
    );
    return new Uint8Array(derivedKey);
};

const generateRandomSessionKey = async () => {
    const key = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 128,
        },
        true,
        ["encrypt", "decrypt"]
    );
    return new Uint8Array(await crypto.subtle.exportKey("raw", key));
};

const encryptSessionKeys = async (
    rawSessionKey: Uint8Array,
    keks: Uint8Array[]
) => {
    const sessionKey = await crypto.subtle.importKey(
        "raw",
        rawSessionKey,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );

    return await Promise.all(
        keks.map(async (rawKek: Uint8Array) => {
            console.info("importing kek");
            const kek = await crypto.subtle.importKey(
                "raw",
                rawKek,
                { name: "HKDF" },
                false,
                ["deriveKey", "deriveBits"]
            );
            console.info("imported hkdf key", kek);

            console.info("wrapping sessionkey");

            const wrappedKey = await crypto.subtle.wrapKey(
                "raw",
                sessionKey,
                kek,
                "AES-KW"
            );

            console.info("encryptedSessionKey", wrappedKey);
            return new Uint8Array(wrappedKey);
        })
    );
};

const encryptMessage = async (sessionKey: Uint8Array, message: string) => {
    const encodedMessage = new TextEncoder().encode(message);

    const key = await crypto.subtle.importKey(
        "raw",
        sessionKey,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    const encryptedMessage = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: sessionKey, // TODO: is it secure for our use cases?
        },
        key,
        encodedMessage
    );

    return encryptedMessage;
};
