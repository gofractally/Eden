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
