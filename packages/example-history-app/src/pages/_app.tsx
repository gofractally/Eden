import { AppProps } from "next/app";
import { EdenSubchain } from "@edenos/common/dist/subchain";
import { useState } from "react";
import "../../../../node_modules/graphiql/graphiql.min.css";

/* global fetch */

let sub: EdenSubchain | null;
async function initEdenChain() {
    try {
        const [, state] = await Promise.all([
            sub!.instantiateStreaming(fetch("demo-micro-chain.wasm")),
            fetch("state").then((r) => r.arrayBuffer()),
        ]);
        sub!.setMemory(state);
        console.log("wasm state loaded");
    } catch (e) {
        console.error(e);
        sub = null;
    }
}

function MyApp({ Component, pageProps }: AppProps) {
    const [subchain, setSubchain] = useState<EdenSubchain | null>();
    if (!sub && typeof window !== "undefined") {
        sub = new EdenSubchain();
        initEdenChain().then(() => {
            setSubchain(sub);
        });
    }
    return <Component {...{ ...pageProps, subchain }} />;
}
export default MyApp;
