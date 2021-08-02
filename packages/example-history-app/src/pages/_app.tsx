import { AppProps } from "next/app";
import {
    useCreateEdenChain,
    EdenChainContext,
} from "@edenos/common/dist/subchain";
import "../../../../node_modules/graphiql/graphiql.min.css";

function MyApp({ Component, pageProps }: AppProps) {
    const subchain = useCreateEdenChain();
    return (
        <EdenChainContext.Provider value={subchain}>
            <Component {...{ ...pageProps, subchain }} />
        </EdenChainContext.Provider>
    );
}
export default MyApp;
