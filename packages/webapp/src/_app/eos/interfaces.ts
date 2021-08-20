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
export interface TableQueryOptions {
    scope?: string;
    lowerBound?: TableIndexBound;
    upperBound?: TableIndexBound;
    limit?: number;
    index_position?: number;
    key_type?: TableKeyType;
}
