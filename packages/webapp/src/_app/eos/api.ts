import { edenContractAccount, rpcEndpoint } from "config";
import { TableQueryIndexOptions, TableQueryOptions } from "./interfaces";

const RPC_URL = `${rpcEndpoint.protocol}://${rpcEndpoint.host}:${rpcEndpoint.port}`;
export const RPC_GET_TABLE_ROWS = `${RPC_URL}/v1/chain/get_table_rows`;

export const CONTRACT_SCOPE = "0";
export const CONTRACT_GLOBAL_TABLE = "global";
export const CONTRACT_MEMBER_TABLE = "member";
export const CONTRACT_ENCRYPTED_TABLE = "encrypted";
export const CONTRACT_MEMBERSTATS_TABLE = "memberstats";
export const CONTRACT_ACCOUNT_TABLE = "account";
export const CONTRACT_ELECTION_STATE_TABLE = "elect.state";
export const CONTRACT_CURRENT_ELECTION_TABLE = "elect.curr";
export const CONTRACT_VOTE_TABLE = "votes";
export const CONTRACT_INDUCTION_TABLE = "induction";
export const CONTRACT_ENDORSEMENT_TABLE = "endorsement";
export const CONTRACT_DISTRIBUTION_ACCOUNTS_TABLE = "distaccount";

export const INDEX_MEMBER_BY_REP = "MemberTableIndexByRep";
export const INDEX_VOTE_BY_GROUP_INDEX = "VoteTableIndexByGroupIndex";

// eosio secondary indexes for distaccount table defined at:
// /contracts/eden/include/distributions.hpp
export const INDEX_BY_OWNER = "DistributionAccountsTableIndexByOwner";

// eosio secondary indexes for inductions defined at:
// /contracts/eden/include/inductions.hpp
export const INDEX_BY_ENDORSER = "EndorsementTableIndexByEndorser";
export const INDEX_BY_INDUCTION = "EndorsementTableIndexByInduction";
export const INDEX_BY_INVITER = "InductionTableIndexByInviter";
export const INDEX_BY_INVITEE = "InductionTableIndexByInvitee";

export interface TableIndexDictionary {
    [TableNameKey: string]: {
        [IndexNameKey: string]: TableQueryIndexOptions;
    };
}

export const TABLE_INDEXES: TableIndexDictionary = {
    [CONTRACT_MEMBER_TABLE]: {
        [INDEX_MEMBER_BY_REP]: {
            index_position: 2,
            key_type: "i128",
        },
    },
    [CONTRACT_VOTE_TABLE]: {
        [INDEX_VOTE_BY_GROUP_INDEX]: {
            key_type: "i64",
            index_position: 2,
        },
    },
    [CONTRACT_DISTRIBUTION_ACCOUNTS_TABLE]: {
        [INDEX_BY_OWNER]: {
            key_type: "i128",
            index_position: 2,
        },
    },
    [CONTRACT_ENDORSEMENT_TABLE]: {
        [INDEX_BY_ENDORSER]: {
            key_type: "i128",
            index_position: 2,
        },
        [INDEX_BY_INDUCTION]: {
            key_type: "i64",
            index_position: 3,
        },
    },
    [CONTRACT_INDUCTION_TABLE]: {
        [INDEX_BY_INVITEE]: {
            key_type: "i128",
            index_position: 2,
        },
        [INDEX_BY_INVITER]: {
            key_type: "i128",
            index_position: 3,
        },
    },
};

type TableResponseRow<T> = [string, T] | T;

interface TableResponse<T> {
    rows: TableResponseRow<T>[];
    more: boolean;
    next_key: string;
}

const TABLE_PARAM_DEFAULTS = {
    scope: CONTRACT_SCOPE,
    lowerBound: "0",
    upperBound: null,
    limit: 1,
    index_position: 1,
} as TableQueryOptions;

export const getRow = async <T>(
    table: string,
    keyName?: string,
    keyValue?: string,
    scope?: string
): Promise<T | undefined> => {
    const options: TableQueryOptions = {};
    if (keyValue) options.lowerBound = keyValue;
    if (scope) options.scope = scope;

    const rows = await getTableRows(table, options);

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
    options?: TableQueryOptions
): Promise<T[]> => {
    const rows = await getTableRawRows(table, options);
    // variants are structured as such: array[type: string, <object the variant contains>]
    // this line is reducing the data to just the data part
    if (rows?.[0]?.length) return rows.map((row) => row[1]);
    return rows;
};

export const getTableRawRows = async <T = any>(
    table: string,
    options?: TableQueryOptions
): Promise<TableResponseRow<T>[]> => {
    options = { ...TABLE_PARAM_DEFAULTS, ...options };
    const reverse = Boolean(options.lowerBound === "0" && options.upperBound);

    const requestBody = {
        code: edenContractAccount,
        json: true,
        reverse,
        show_payer: false,
        table: table,
        ...options,
        lower_bound: options.lowerBound,
        upper_bound: options.upperBound,
    };

    const response = await fetch(RPC_GET_TABLE_ROWS, {
        method: "POST",
        body: JSON.stringify(requestBody),
    });

    const data = (await response.json()) as TableResponse<T>;
    console.info(
        `fetched table ${edenContractAccount}.${table} (index ${options.index_position}-${options.key_type}) rows`,
        data
    );

    if (!data || !data.rows) {
        throw new Error("Invalid table results");
    }

    return reverse ? data.rows.reverse() : data.rows;
};
