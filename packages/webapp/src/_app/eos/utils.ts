import hash from "hash.js";
import * as eosjsSerialize from "eosjs/dist/eosjs-serialize";
import * as eosjsNumeric from "eosjs/dist/eosjs-numeric";

export const accountTo32BitHash = (account: string): number[] =>
    hash.sha256().update(account).digest().slice(0, 4);

export const primaryKeyFromAccountInstant = (account: string): string => {
    const serialBuffer = new eosjsSerialize.SerialBuffer();
    serialBuffer.pushArray(accountTo32BitHash(account));
    serialBuffer.pushUint32(Date.now());

    const bytes = serialBuffer.getUint8Array(8);
    return eosjsNumeric.binaryToDecimal(bytes);
};

export const i128BoundsForAccount = (account: string) => {
    return {
        lower: accountsToI128(account, "............"),
        upper: accountsToI128(account, "zzzzzzzzzzzzj"),
    };
};

export const accountsToI128 = (account1: string, account2: string): string => {
    const serialBuffer = new eosjsSerialize.SerialBuffer();
    // respects little endianness for eos i128 secondary keys
    serialBuffer.pushName(account2);
    serialBuffer.pushName(account1);
    const bytes = serialBuffer.getUint8Array(16);
    return eosjsNumeric.binaryToDecimal(bytes);
};
