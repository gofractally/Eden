import { AppProps } from "next/app";
import {
    useCreateEdenChain,
    EdenChainContext,
} from "@edenos/common/dist/subchain";
import "../../../../node_modules/graphiql/graphiql.min.css";

if (
    !process.env.NEXT_PUBLIC_SUBCHAIN_WASM_URL ||
    !process.env.NEXT_PUBLIC_SUBCHAIN_STATE_URL ||
    !process.env.NEXT_PUBLIC_SUBCHAIN_WS_URL ||
    !process.env.NEXT_PUBLIC_SUBCHAIN_SHOW_MO
) {
    throw new Error("WebApp Environment Variables are not set");
}

function MyApp({ Component, pageProps }: AppProps) {
    const subchain = useCreateEdenChain(
        process.env.NEXT_PUBLIC_SUBCHAIN_WASM_URL,
        process.env.NEXT_PUBLIC_SUBCHAIN_STATE_URL,
        process.env.NEXT_PUBLIC_SUBCHAIN_WS_URL,
        process.env.NEXT_PUBLIC_SUBCHAIN_SHOW_MO
    );
    return (
        <EdenChainContext.Provider value={subchain}>
            <Component {...{ ...pageProps, subchain }} />
        </EdenChainContext.Provider>
    );
}
export default MyApp;
