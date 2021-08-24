export type TableKeyType =
    | "name"
    | "i64"
    | "i128"
    | "i256"
    | "float64"
    | "float128"
    | "sha256"
    | "ripemd160";

type TableIndexBound = number | string | null;
export interface TableQueryIndexOptions {
    index_position: number;
    key_type: TableKeyType;
}

export interface TableQueryOptionsBase {
    scope?: string;
    lowerBound?: TableIndexBound;
    upperBound?: TableIndexBound;
    limit?: number;
    index_position?: number;
    key_type?: TableKeyType;
}

// leave wrong for TableQueryOptions that don't include secondary indexes
export type TableQueryOptions = TableQueryOptionsBase &
    Partial<TableQueryIndexOptions>;
