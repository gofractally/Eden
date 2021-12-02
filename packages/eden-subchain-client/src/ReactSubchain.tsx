import SubchainClient, { SubchainClientOptions } from "./SubchainClient";
import { useContext, useEffect, useState, createContext } from "react";

export interface UseSubchainClientOptions {
    fetch: any;
    edenAccount?: string;
    tokenAccount?: string;
    atomicAccount?: string;
    atomicmarketAccount?: string;
    wasmUrl: string;
    stateUrl: string;
    blocksUrl: string;
    slowmo?: boolean;
}

export function useCreateEdenChain(
    options: UseSubchainClientOptions
): SubchainClient | null {
    const [subchain, setSubchain] = useState<SubchainClient | null>(null);
    useEffect(() => {
        if (options.fetch) {
            let client: SubchainClient;
            (async () => {
                try {
                    const fetch = options.fetch;
                    client = new SubchainClient(WebSocket);
                    await client.instantiateStreaming({
                        edenAccount: options.edenAccount,
                        tokenAccount: options.tokenAccount,
                        atomicAccount: options.atomicAccount,
                        atomicmarketAccount: options.atomicmarketAccount,
                        wasmResponse: fetch(options.wasmUrl),
                        stateResponse: fetch(options.stateUrl),
                        blocksUrl: options.blocksUrl,
                        slowmo: options.slowmo,
                    });
                    setSubchain(client);
                } catch (e) {
                    console.error(e);
                }
            })();
            return () => {
                console.log("shutdown SubchainClient");
                if (client) client.shutdown();
            };
        }
    }, []);
    return subchain;
}

export const EdenChainContext = createContext<SubchainClient | null>(null);

export interface QueryResult<T> {
    isLoading: boolean; // flags if the query is loading
    data?: T; // has the query data when it's loaded or empty if not found
    isError: boolean; // flags that an error happened
    errors?: any; // contains the errors if there are any
}

export function useQuery<T = any>(query: string): QueryResult<T> {
    const client = useContext(EdenChainContext);
    const [cachedQuery, setCachedQuery] = useState<string | null>();

    // non-signalling state
    const [state, setState] = useState({
        mounted: true,
        cachedClient: null as SubchainClient | null,
        subscribed: null as SubchainClient | null,
        cachedQueryResult: {
            isLoading: false,
            isError: false,
        } as QueryResult<T>,
    });

    useEffect(() => {
        return () => {
            console.info("unmounting query state >>>");
            state.mounted = false;
            // setState({ ...state, mounted: false });
        };
    }, []);

    useEffect(() => {
        if (client && state.subscribed !== client) {
            console.info(
                "update effect state subscribed >>>",
                state.subscribed,
                client
            );

            state.subscribed = client;
            // setState({ ...state, subscribed: client });
            client.notifications.push((c) => {
                if (state.mounted && c === state.subscribed) {
                    console.info("cleaning out state subscribed >>>");
                    setCachedQuery(null);
                    state.subscribed = null;
                    // setState({ ...state, subscribed: null });
                }
            });
        }
    });

    if (state.cachedClient !== client || query !== cachedQuery) {
        if (state.cachedClient !== client) {
            console.info("setting client >>>", client, state.cachedClient);
        }

        if (query !== cachedQuery) {
            console.info("setting cached query >>>", query, cachedQuery);
        }

        state.cachedClient = client;
        setCachedQuery(query);
        if (client?.subchain) {
            try {
                const queryResult = client.subchain.query(query);
                state.cachedQueryResult = {
                    ...queryResult,
                    isLoading: false,
                    isError: Boolean(queryResult.errors),
                };
            } catch (e: any) {
                state.cachedQueryResult = {
                    isLoading: false,
                    isError: true,
                    errors: [{ message: e + "" }],
                };
            }
        } else {
            state.cachedQueryResult = {
                isLoading: true,
                isError: false,
            };
        }
    }
    return state.cachedQueryResult;
}

interface PageInfo {
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    startCursor: string;
    endCursor: string;
}

export interface PagedQuery<T> {
    pageInfo: PageInfo;
    edges: T[];
}

export interface PagedQueryResult<T> {
    result: QueryResult<T>;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    next(): void;
    previous(): void;
    first(): void;
    last(): void;
}

export function usePagedQuery<T = any>(
    query: string,
    pageSize: number,
    getPageInfo: (result: QueryResult<T>) => PageInfo | null | undefined
): PagedQueryResult<T> {
    const [args, setArgs] = useState(`first:${pageSize}`);
    const result = useQuery<T>(query.replace("@page@", args));
    const pageInfo = getPageInfo(result) || {
        hasPreviousPage: false,
        hasNextPage: false,
        startCursor: "",
        endCursor: "",
    };
    return {
        result,
        hasPreviousPage: pageInfo.hasPreviousPage,
        hasNextPage: pageInfo.hasNextPage,
        next() {
            setArgs(`first:${pageSize} after:"${pageInfo.endCursor}"`);
        },
        previous() {
            setArgs(`last:${pageSize} before:"${pageInfo.startCursor}"`);
        },
        first() {
            setArgs(`first:${pageSize}`);
        },
        last() {
            setArgs(`last:${pageSize}`);
        },
    };
}
