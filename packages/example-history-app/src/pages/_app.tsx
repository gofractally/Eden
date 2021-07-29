import { AppProps } from "next/app";
import {
    useCreateEdenChain,
    EdenChainContext,
} from "../../../common/src/subchain/ReactSubchain";
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
