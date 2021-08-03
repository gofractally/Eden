import { AppProps } from "next/app";
import {
    useCreateEdenChain,
    EdenChainContext,
} from "@edenos/common/dist/subchain";
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
    throw new Error("WebApp Environment Variables are not set");
}

function MyApp({ Component, pageProps }: AppProps) {
    const subchain = useCreateEdenChain(
        process.env.NEXT_PUBLIC_EDEN_CONTRACT || "genesis.eden",
        process.env.NEXT_PUBLIC_TOKEN_CONTRACT || "eosio.token",
        process.env.NEXT_PUBLIC_AA_CONTRACT || "atomicassets",
        process.env.NEXT_PUBLIC_AA_MARKET_CONTRACT || "atomicmarket",
        process.env.NEXT_PUBLIC_SUBCHAIN_WASM_URL ||
            "http://localhost:3032/subchain/eden-micro-chain.wasm",
        process.env.NEXT_PUBLIC_SUBCHAIN_SLOW_MO === "true"
            ? "bad_state_file_name_for_slow_mo"
            : process.env.NEXT_PUBLIC_SUBCHAIN_STATE_URL ||
                  "http://localhost:3032/subchain/state",
        process.env.NEXT_PUBLIC_SUBCHAIN_WS_URL ||
            "ws://localhost:3032/subchain/eden-microchain",
        process.env.NEXT_PUBLIC_SUBCHAIN_SLOW_MO === "true"
    );
    return (
        <EdenChainContext.Provider value={subchain}>
            <Component {...{ ...pageProps, subchain }} />
        </EdenChainContext.Provider>
    );
}
export default MyApp;
