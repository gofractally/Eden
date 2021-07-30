import SubchainClient from "./SubchainClient";
import { useContext, useEffect, useState, createContext } from "react";

export function useCreateEdenChain(): SubchainClient | null {
    const [subchain, setSubchain] = useState<SubchainClient | null>(null);
    useEffect(() => {
        if (typeof window !== "undefined") {
            let client: SubchainClient;
            (async () => {
                try {
                    console.log("create SubchainClient");
                    client = new SubchainClient();
                    await client!.instantiateStreaming(
                        fetch("demo-micro-chain.wasm"),
                        "ws://localhost:3002/eden-microchain"
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

export function usePagedQuery<T = any>(query: string, pageSize: number) {
    const [args, setArgs] = useState(`first:${pageSize}`);
    const result = useQuery<T>(query.replace("@page@", args));
    return {
        result,
        next(cursor: string) {
            setArgs(`first:${pageSize} after:"${cursor}"`);
        },
        previous(cursor: string) {
            setArgs(`last:${pageSize} before:"${cursor}"`);
        },
        first() {
            setArgs(`first:${pageSize}`);
        },
        last() {
            setArgs(`last:${pageSize}`);
        },
    };
}
