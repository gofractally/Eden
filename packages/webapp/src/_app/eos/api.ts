import { edenContractAccount, rpcEndpoint } from "config";

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

export const getRow = async <T>(
    table: string,
    keyName?: string, // move these into options obj
    keyValue?: string,
    options?: any,
): Promise<T | undefined> => {
    const rows = options && options.scope ?
        await getTableRows(table, options.scope, keyValue)
        : await getTableRows(table, undefined, keyValue); // FIX THIS
    console.info('getRow() --> rows:')
    console.info(rows)
    if (!rows.length) {
        return undefined;
    }

    if (keyName && keyValue && `${rows[0][keyName]}` !== `${keyValue}`) {
        return undefined;
    }

    return rows[0];
};

export const getTableRows = async <T = any>(
    table: string,
    scope: string = CONTRACT_SCOPE,
    lowerBound: any = "0",
    upperBound: any = null,
    limit = 1
): Promise<T[]> => {
    console.info('getTableRows()')
    const reverse = Boolean(lowerBound === "0" && upperBound);

    console.info(`Requesting table[${table}], scope[${scope}]`)

    const requestBody = {
        code: edenContractAccount,
        index_position: 1,
        json: true,
        key_type: "",
        limit: `${limit}`,
        lower_bound: lowerBound,
        upper_bound: upperBound,
        reverse,
        scope,
        show_payer: false,
        table: table,
        table_key: "",
    };
    console.info('requestBody:')
    console.info(requestBody)

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
