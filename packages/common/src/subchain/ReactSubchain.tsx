import SubchainClient from "./SubchainClient";
import { useContext, useEffect, useState, createContext } from "react";

export function useCreateEdenChain(
    edenAccount: string,
    tokenAccount: string,
    atomicAccount: string,
    atomicmarketAccount: string,
    wasmUrl: string,
    stateUrl: string,
    wsUrl: string,
    slowMo: boolean
): SubchainClient | null {
    const [subchain, setSubchain] = useState<SubchainClient | null>(null);
    useEffect(() => {
        if (typeof window !== "undefined") {
            let client: SubchainClient;
            (async () => {
                try {
                    console.log("create SubchainClient");
                    client = new SubchainClient();
                    await client.instantiateStreaming(
                        edenAccount,
                        tokenAccount,
                        atomicAccount,
                        atomicmarketAccount,
                        fetch(wasmUrl),
                        fetch(stateUrl),
                        wsUrl,
                        slowMo
                    );
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

export interface Query<T> {
    isLoading: boolean; // flags if the query is loading
    data?: T; // has the query data when it's loaded or empty if not found
    error?: any; // flags an error in case it fails to load the query
}

export function useQuery<T = any>(query: string): Query<T> {
    const client = useContext(EdenChainContext);
    const [cachedQuery, setCachedQuery] = useState<string | null>();
    // non-signalling state
    const [state] = useState({
        mounted: true,
        cachedClient: null as SubchainClient | null,
        subscribed: null as SubchainClient | null,
        cachedQueryResult: { isLoading: false } as Query<T>,
    });
    useEffect(() => {
        return () => {
            state.mounted = false;
        };
    }, []);
    useEffect(() => {
        if (client && state.subscribed !== client) {
            state.subscribed = client;
            client.notifications.push((c) => {
                if (state.mounted && c === state.subscribed) {
                    setCachedQuery(null);
                    state.subscribed = null;
                }
            });
        }
    });
    if (state.cachedClient !== client || query !== cachedQuery) {
        state.cachedClient = client;
        setCachedQuery(query);
        if (client?.subchain) {
            state.cachedQueryResult = {
                data: client.subchain.query(query).data,
                isLoading: false,
            };
            state.cachedQueryResult = client.subchain.query(query);
        } else {
            state.cachedQueryResult = {
                isLoading: false,
                error: "subchain not present",
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

export function usePagedQuery<T = any>(
    query: string,
    pageSize: number,
    getPageInfo: (result: Query<T>) => PageInfo | null | undefined
) {
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
