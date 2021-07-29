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

export function useQuery(query: string): any {
    const client = useContext(EdenChainContext);
    const [cachedClient, setCachedClient] = useState<SubchainClient | null>();
    const [cachedQuery, setCachedQuery] = useState<string | null>();
    const [cachedQueryResult, setCachedQueryResult] = useState<any>();
    const [registeredNotification, setRegisteredNotification] = useState(false);
    useEffect(() => {
        if (client && !registeredNotification) {
            setRegisteredNotification(true);
            client.notifications.push(() => {
                setCachedQuery(null);
                setRegisteredNotification(false);
            });
        }
    });
    if (cachedClient !== client || query !== cachedQuery) {
        setCachedClient(client);
        setCachedQuery(query);
        setRegisteredNotification(false);
        if (client?.subchain)
            setCachedQueryResult(client.subchain.query(query));
        else setCachedQueryResult(null);
    }
    return cachedQueryResult;
}
