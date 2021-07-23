import { PrivateKey, PublicKey } from "eosjs/dist/eosjs-jssig";
import { generateKeyPair } from "eosjs/dist/eosjs-key-conversions";
import { KeyType } from "eosjs/dist/eosjs-numeric";

/**
 * Provides a way to encrypt data to be published on chain. Useful for
 * secretly sharing any temporal data. Eg. induction meeting links, election
 * room links.
 *
 * IMPORTANT NOTES:
 * - Any data on chain will eventually be decrypted. Never use it for PII (read the
 * above description for reasanoble use cases).
 * - The key curve for all participants need to be the same. EdenOS interface
 * ensures that all generated encryption public keys are K1.
 * - ECDH secrets derived bytes are in Big Endianess order.
 */
export const publishSecretToChain = async (
    message: string,
    publisherAccount: string,
    recipientAccounts: string[],
    info?: string
) => {
    // TODO: Remove all the print messages
    console.info("encrypting message", message);
    const [publisherKey, ...recipientKeys] = await fetchRecipientKeys([
        publisherAccount,
        ...recipientAccounts,
    ]);
    console.info(publisherKey, recipientKeys);

    // TODO: check publisherkey matches the current one in browser

    const transientKeyPair = generateKeyPair(KeyType.k1, { secureEnv: true });
    console.info(transientKeyPair);

    const keks = await ecdhRecipientsKeyEncriptionKeys(
        [publisherKey, ...recipientKeys],
        transientKeyPair.privateKey,
        info
    );
    console.info(keks);

    const sessionKey = await generateRandomSessionKey();
    console.info("session key", sessionKey);

    const encryptedSessionKeys = await encryptSessionKeys(sessionKey, keks);
    console.info(encryptedSessionKeys);

    const encryptedMessage = await encryptMessage(sessionKey, message);

    // TODO: prepare publish trx to eos chain with all the prepared material
    // eden.publishelection(
    //     publisher = logged_in_user
    //     round_no = '2',
    //     encrypted_link,
    //   // for each recipient
    //     [(encrypted_session_keyN, recipient_keyN, transient_ecc_pubkey)]
    //   )
    console.info({
        encryptedSessionKeys,
        publisherKey,
        recipientKeys,
        transientKeyPair,
        encryptedMessage,
    });

    // TODO: remove this test
    console.info("testing decryption...");
    await decryptPublishedMessage(
        encryptedMessage,
        publisherKey,
        transientKeyPair.publicKey.toString(),
        encryptedSessionKeys[0],
        info
    );

    return {};
};

export const decryptPublishedMessage = async (
    encryptedMessage: Uint8Array,
    recipientPublicKey: string,
    transientPublicKey: string,
    encryptedSessionKey: Uint8Array,
    info?: string
) => {
    const recipientPrivateKey = retrieveRecipientPrivateKey(recipientPublicKey);
    const ecdhSecret = deriveEcdhSecret(
        recipientPrivateKey,
        PublicKey.fromString(transientPublicKey)
    );
    console.info("ecdh secret is ", ecdhSecret);
    const hkdfKey = await hkdfSha256FromEcdh(ecdhSecret, info);
    console.info("hkdf key to unwrap is", hkdfKey);
    const sessionKey = await unwrapSessionKey(encryptedSessionKey, hkdfKey);
    console.info("unwrapped session key!", sessionKey);
    const message = await decryptMessage(sessionKey, encryptedMessage);
    console.info("decrypted message:", message);
    return message;
};

const retrieveRecipientPrivateKey = (publicKey: string): PrivateKey => {
    // TODO: find the corresponding private key in the localstorage, or else throw
    console.info("retrieving publicKey...");
    const rawPrivateKey = "5KcMypBPGByXbeBphsVzyyzUvg31tWNKsgrfXs2MmanYgYf4gao";
    return PrivateKey.fromString(rawPrivateKey);
};

const fetchRecipientKeys = async (accounts: string[]) => {
    // TODO: real implementation
    // fetch eden.members( where account = each account item )

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

const ecdhRecipientsKeyEncriptionKeys = async (
    recipientPublicKeys: string[],
    transientPrivateKey: PrivateKey,
    info?: string
): Promise<CryptoKey[]> => {
    return Promise.all(
        recipientPublicKeys.map(async (publicKey: string) => {
            const ecdhSecret = deriveEcdhSecret(
                transientPrivateKey,
                PublicKey.fromString(publicKey)
            );
            console.info(ecdhSecret);
            return await hkdfSha256FromEcdh(ecdhSecret, info);
        })
    );
};

const deriveEcdhSecret = (
    eosPrivateKeyA: PrivateKey,
    eosPublicKeyB: PublicKey
) => {
    return eosPrivateKeyA
        .toElliptic()
        .derive(eosPublicKeyB.toElliptic().getPublic())
        .toArrayLike(ArrayBuffer);
};

const hkdfSha256FromEcdh = async (
    ecdhSecret: ArrayBuffer,
    info?: string
): Promise<CryptoKey> => {
    const sharedSecretKey = await crypto.subtle.importKey(
        "raw",
        ecdhSecret,
        { name: "HKDF" },
        false,
        ["deriveKey", "deriveBits"]
    );

    const encodedInfo = info ? new TextEncoder().encode(info) : [];
    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: new Uint8Array([]),
            info: new Uint8Array(encodedInfo),
        },
        sharedSecretKey,
        {
            name: "AES-KW",
            length: 128,
        },
        true,
        ["wrapKey", "unwrapKey"]
    );
    return derivedKey;
};

const generateRandomSessionKey = (): Promise<CryptoKey> => {
    return crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 128,
        },
        true,
        ["encrypt", "decrypt"]
    );
};

const encryptSessionKeys = async (sessionKey: CryptoKey, keks: CryptoKey[]) => {
    return Promise.all(
        keks.map(async (kek: CryptoKey) => {
            const wrappedKey = await crypto.subtle.wrapKey(
                "raw",
                sessionKey,
                kek,
                "AES-KW"
            );
            return new Uint8Array(wrappedKey);
        })
    );
};

const encryptMessage = async (
    sessionKey: CryptoKey,
    message: string
): Promise<Uint8Array> => {
    const encodedMessage = new TextEncoder().encode(message);
    const encryptedMessage = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array([0]),
        },
        sessionKey,
        encodedMessage
    );
    return new Uint8Array(encryptedMessage);
};

const unwrapSessionKey = async (
    sessionKey: Uint8Array,
    hkdfKey: CryptoKey
): Promise<CryptoKey> => {
    return crypto.subtle.unwrapKey(
        "raw",
        sessionKey,
        hkdfKey,
        "AES-KW",
        { name: "AES-GCM", length: 128 },
        false,
        ["decrypt"]
    );
};

const decryptMessage = async (
    sessionKey: CryptoKey,
    encryptedMessage: Uint8Array
): Promise<String> => {
    const encodedMessage = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array([0]),
        },
        sessionKey,
        encryptedMessage
    );
    const decodedMessage = new TextDecoder().decode(encodedMessage);
    return decodedMessage;
};
