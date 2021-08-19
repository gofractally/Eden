import { EncryptedKey, getEncryptionKey } from "encryption";
import { PrivateKey, PublicKey } from "eosjs/dist/eosjs-jssig";
import { generateKeyPair } from "eosjs/dist/eosjs-key-conversions";
import { KeyType } from "eosjs/dist/eosjs-numeric";
import { queryClient } from "pages/_app";
import { QueryClient } from "react-query";

import { queryMemberByAccountName } from "_app/hooks";

interface AccountKeys {
    [account: string]: string | undefined;
}

/**
 * Provides a way to encrypt data to be published on chain. Useful for
 * secretly sharing any temporary data. Eg. induction meeting links, election
 * room links.
 *
 * IMPORTANT NOTES:
 * - Never use it for encrypting PII or sensitive data. Read the above
 * description for reasanoble use cases. Attackers will eventually be able to
 * decrypt yout messages.
 * - The key curve for all participants need to be the same. EdenOS interface
 * ensures that all generated encryption public keys are K1.
 * - ECDH secrets derived bytes are in Big Endianess order.
 */
export const encryptSecretForPublishing = async (
    message: string,
    publisherAccount: string,
    recipientAccounts: string[],
    info?: string
) => {
    const accountKeys = await fetchAccountKeys(
        [publisherAccount, ...recipientAccounts],
        queryClient
    );

    const publicKeys = validateFetchedKeys(
        accountKeys,
        publisherAccount,
        recipientAccounts
    );

    const transientKeyPair = generateEncryptionKey();

    const keks = await ecdhRecipientsKeyEncryptionKeys(
        publicKeys,
        transientKeyPair.privateKey,
        info
    );

    const sessionKey = await generateRandomSessionKey();

    const encryptedSessionKeys = await encryptSessionKeys(sessionKey, keks);

    const encryptedMessage = await encryptMessage(sessionKey, message);

    const senderKey = transientKeyPair.publicKey.toString();
    const contractFormatEncryptedKeys: EncryptedKey[] = encryptedSessionKeys.map(
        (encryptedKey, i) => ({
            sender_key: senderKey,
            recipient_key: publicKeys[i],
            key: encryptedKey,
        })
    );

    const publisherKey = publicKeys[0];
    const decryptedMessage = await decryptPublishedMessage(
        encryptedMessage,
        publisherKey,
        senderKey,
        encryptedSessionKeys[0],
        info
    );
    if (decryptedMessage !== message) {
        throw new Error(
            "an error occurred during encryption/decryption of the data"
        );
    }

    return {
        contractFormatEncryptedKeys,
        encryptedMessage,
    };
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
    const hkdfKey = await hkdfSha256FromEcdh(ecdhSecret, info);
    const sessionKey = await unwrapSessionKey(encryptedSessionKey, hkdfKey);
    const message = await decryptMessage(sessionKey, encryptedMessage);
    return message;
};

export const generateEncryptionKey = () =>
    generateKeyPair(KeyType.k1, { secureEnv: true });

const retrieveRecipientPrivateKey = (publicKey: string): PrivateKey => {
    const rawPrivateKey = getEncryptionKey(publicKey);
    if (!rawPrivateKey) {
        throw new Error("fail to retrieve private key for decrypting message");
    }
    return PrivateKey.fromString(rawPrivateKey);
};

const fetchAccountKeys = async (
    accounts: string[],
    queryClient: QueryClient
): Promise<AccountKeys> => {
    const keys = await Promise.all(
        accounts.map(async (account) => {
            const { queryKey, queryFn } = queryMemberByAccountName(account);
            const member = await queryClient.fetchQuery(queryKey, queryFn);
            return member?.encryption_key;
        })
    );

    const accountKeys: AccountKeys = {};
    keys.forEach((key, i) => (accountKeys[accounts[i]] = key));
    return accountKeys;
};

const validateFetchedKeys = (
    accountKeys: AccountKeys,
    publisherAccount: string,
    recipientAccounts: string[]
) => {
    const publisherKey = accountKeys[publisherAccount];
    if (!publisherKey) {
        throw new Error("You have not defined an encryption key");
    }

    if (!getEncryptionKey(publisherKey)) {
        throw new Error(
            "Your encryption key could not be found in this browser"
        );
    }

    const recipientKeys: string[] = [];
    for (const recipientAccount of recipientAccounts) {
        const recipientKey = accountKeys[recipientAccount];
        if (recipientKey) {
            recipientKeys.push(recipientKey);
        }
    }

    if (recipientKeys.length < 1) {
        throw new Error(
            "No other recipients have enabled a valid encryption key"
        );
    }

    return [publisherKey, ...recipientKeys];
};

const ecdhRecipientsKeyEncryptionKeys = async (
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
        .toArrayLike(Uint8Array).buffer;
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
): Promise<string> => {
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
