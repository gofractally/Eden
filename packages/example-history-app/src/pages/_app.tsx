import { AppProps } from "next/app";
import fetch from "node-fetch";
import {
    useCreateEdenChain,
    EdenChainContext,
} from "@edenos/eden-subchain-client/dist/ReactSubchain";
import "../../../../node_modules/graphiql/graphiql.min.css";

if (
    !process.env.NEXT_PUBLIC_EDEN_CONTRACT ||
    !process.env.NEXT_PUBLIC_TOKEN_CONTRACT ||
    !process.env.NEXT_PUBLIC_AA_CONTRACT ||
    !process.env.NEXT_PUBLIC_AA_MARKET_CONTRACT ||
    !process.env.NEXT_PUBLIC_SUBCHAIN_WASM_URL ||
    !process.env.NEXT_PUBLIC_SUBCHAIN_STATE_URL ||
    !process.env.NEXT_PUBLIC_SUBCHAIN_WS_URL ||
    !process.env.NEXT_PUBLIC_SUBCHAIN_SLOW_MO
) {
    throw new Error("ExampleHistoryApp Environment Variables are not set");
}

const MyApp = ({ Component, pageProps }: AppProps) => {
    const subchain = useCreateEdenChain({
        edenAccount: process.env.NEXT_PUBLIC_EDEN_CONTRACT || "genesis.eden",
        tokenAccount: process.env.NEXT_PUBLIC_TOKEN_CONTRACT || "eosio.token",
        atomicAccount: process.env.NEXT_PUBLIC_AA_CONTRACT || "atomicassets",
        atomicmarketAccount:
            process.env.NEXT_PUBLIC_AA_MARKET_CONTRACT || "atomicmarket",
        wasmResponse: fetch(
            process.env.NEXT_PUBLIC_SUBCHAIN_WASM_URL ||
                "http://localhost:3032/v1/subchain/eden-micro-chain.wasm"
        ) as any,
        stateResponse: fetch(
            process.env.NEXT_PUBLIC_SUBCHAIN_SLOW_MO === "true"
                ? "bad_state_file_name_for_slow_mo"
                : process.env.NEXT_PUBLIC_SUBCHAIN_STATE_URL ||
                      "http://localhost:3032/v1/subchain/state"
        ) as any,
        blocksUrl:
            process.env.NEXT_PUBLIC_SUBCHAIN_WS_URL ||
            "ws://localhost:3032/v1/subchain/eden-microchain",
        slowmo: process.env.NEXT_PUBLIC_SUBCHAIN_SLOW_MO === "true",
    });
    return (
        <EdenChainContext.Provider value={subchain}>
            <Component {...{ ...pageProps, subchain }} />
        </EdenChainContext.Provider>
    );
};
export default MyApp;
