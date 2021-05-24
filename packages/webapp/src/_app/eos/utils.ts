import hash from "hash.js";
import * as eosjsSerialize from "eosjs/dist/eosjs-serialize";
import * as eosjsNumeric from "eosjs/dist/eosjs-numeric";
import * as eosjsJsonRpc from "eosjs/dist/eosjs-jsonrpc";
import * as eosjsApi from "eosjs/dist/eosjs-api";

import { rpcEndpoint } from "config";

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

const rpcEndpointUrl = `${rpcEndpoint.protocol}://${rpcEndpoint.host}:${rpcEndpoint.port}`;
export const eosJsonRpc = new eosjsJsonRpc.JsonRpc(rpcEndpointUrl);
const initialTypes = eosjsSerialize.createInitialTypes();

export const eosDefaultApi = new eosjsApi.Api({
    rpc: eosJsonRpc,
    signatureProvider: {
        getAvailableKeys: async () => [],
        sign: async (args: any) => {
            throw new Error("implement");
        },
    },
});

export const getContractAbi = async (account: string) => {
    const result = await eosJsonRpc.get_abi(account);
    return result.abi;
};

export const serializeType = async (
    account: string,
    type: string,
    buffer: eosjsSerialize.SerialBuffer,
    data: any
) => {
    const abi = await getContractAbi(account);
    const types = eosjsSerialize.getTypesFromAbi(initialTypes, abi);

    const abiType = types.get(type);
    if (!abiType) {
        throw new Error("invalid abi type");
    }

    abiType.serialize(buffer, data);
};

export const hash256EosjsSerialBuffer = (
    buffer: eosjsSerialize.SerialBuffer
): string => hash.sha256().update(buffer.asUint8Array()).digest("hex");

export const eosBlockTimestampISO = (timestamp: string) => {
    return timestamp.endsWith("Z") ? timestamp : timestamp + "Z";
};
