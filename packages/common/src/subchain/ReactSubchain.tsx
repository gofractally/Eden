import SubchainClient from "./SubchainClient";
import { useContext, useEffect, useState, createContext } from "react";

export function useCreateEdenChain(
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
                    await client!.instantiateStreaming(
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

export function useQuery<T = any>(query: string): T {
    const client = useContext(EdenChainContext);
    const [cachedQuery, setCachedQuery] = useState<string | null>();
    // non-signalling state
    const [state] = useState({
        mounted: true,
        cachedClient: null as SubchainClient | null,
        subscribed: null as SubchainClient | null,
        cachedQueryResult: null as any,
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
            state.cachedQueryResult = client.subchain.query(query);
        } else {
            state.cachedQueryResult = null;
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
    getPageInfo: (result: T) => PageInfo | null | undefined
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
