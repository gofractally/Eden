import { edenContractAccount, rpcEndpoint } from "config";
import { TableQueryOptions } from "./interfaces";

const RPC_URL = `${rpcEndpoint.protocol}://${rpcEndpoint.host}:${rpcEndpoint.port}`;
export const RPC_GET_TABLE_ROWS = `${RPC_URL}/v1/chain/get_table_rows`;

export const CONTRACT_SCOPE = "0";
export const CONTRACT_GLOBAL_TABLE = "global";
export const CONTRACT_MEMBER_TABLE = "member";
export const CONTRACT_MEMBERSTATS_TABLE = "memberstats";
export const CONTRACT_ACCOUNT_TABLE = "account";
export const CONTRACT_INDUCTION_TABLE = "induction";
export const CONTRACT_ENDORSEMENT_TABLE = "endorsement";

interface TableResponse<T> {
    rows: [string, T][];
    more: boolean;
    next_key: string;
}

const TABLE_PARAM_DEFAULTS = {
    scope: CONTRACT_SCOPE,
    lowerBound: "0",
    upperBound: null,
    limit: 1,
};

export const getRow = async <T>(
    table: string,
    options?: { keyName?: string; keyValue?: string } & TableQueryOptions
): Promise<T | undefined> => {
    options = { ...TABLE_PARAM_DEFAULTS, ...options };
    options.lowerBound = options.keyValue;
    const rows = await getTableRows(table, options);

    if (!rows.length) {
        return undefined;
    }

    if (
        options &&
        options.keyName &&
        options.keyValue &&
        `${rows[0][options.keyName]}` !== `${options.keyValue}`
    ) {
        return undefined;
    }

    return rows[0];
};

export const getTableRows = async <T = any>(
    table: string,
    options: TableQueryOptions
): Promise<T[]> => {
    options = { ...TABLE_PARAM_DEFAULTS, ...options };
    const reverse = Boolean(options.lowerBound === "0" && options.upperBound);

    const requestBody = {
        code: edenContractAccount,
        index_position: 1,
        json: true,
        key_type: "",
        limit: `${options.limit}`,
        lower_bound: options.lowerBound,
        upper_bound: options.upperBound,
        reverse,
        scope: options.scope,
        show_payer: false,
        table: table,
        table_key: "",
    };

    const response = await fetch(RPC_GET_TABLE_ROWS, {
        method: "POST",
        body: JSON.stringify(requestBody),
    });

    const data = (await response.json()) as TableResponse<T>;
    console.info(`fetched table ${edenContractAccount}.${table} rows`, data);

    if (!data || !data.rows) {
        throw new Error("Invalid table results");
    }

    const rows = reverse ? data.rows.reverse() : data.rows;
    return rows.map((row) => row[1]);
};

export const getTableIndexRows = async (
    table: string,
    indexPosition: number,
    keyType:
        | "name"
        | "i64"
        | "i128"
        | "i256"
        | "float64"
        | "float128"
        | "sha256"
        | "ripemd160",
    lowerBound: any,
    upperBound?: any,
    limit = 100
) => {
    const requestBody = {
        code: edenContractAccount,
        index_position: indexPosition,
        json: true,
        key_type: keyType,
        limit: `${limit}`,
        lower_bound: lowerBound,
        upper_bound: upperBound,
        reverse: false,
        scope: CONTRACT_SCOPE,
        show_payer: false,
        table,
    };

    const response = await fetch(RPC_GET_TABLE_ROWS, {
        method: "POST",
        body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.info(
        `fetched table ${edenContractAccount}.${table} (index ${indexPosition}-${keyType}) rows`,
        data
    );

    if (!data || !data.rows) {
        throw new Error("Invalid table results");
    }

    return data.rows.map((row: any) => row[1]);
};
