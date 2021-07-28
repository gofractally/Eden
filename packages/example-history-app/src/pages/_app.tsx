import { AppProps } from "next/app";
import EdenSubchain from "../../../common/src/subchain/EdenSubchain";
import SubchainClient from "../../../common/src/subchain/SubchainClient";
import { useState } from "react";
import "../../../../node_modules/graphiql/graphiql.min.css";

/* global fetch */

let client: SubchainClient | null;
async function initEdenChain() {
    try {
        await client!.instantiateStreaming(
            fetch("demo-micro-chain.wasm"),
            "ws://localhost:3002/eden-microchain"
        );
    } catch (e) {
        console.error(e);
        client = null;
    }
}

function MyApp({ Component, pageProps }: AppProps) {
    const [subchain, setSubchain] = useState<EdenSubchain | null>();
    if (!client && typeof window !== "undefined") {
        client = new SubchainClient();
        initEdenChain().then(() => {
            setSubchain(client?.subchain);
        });
    }
    return <Component {...{ ...pageProps, subchain }} />;
}
export default MyApp;
