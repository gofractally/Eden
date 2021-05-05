import { useRef } from "react";
import dynamic from "next/dynamic";
import { AppProps } from "next/app";
import Router from "next/router";
import { QueryClient, QueryClientProvider } from "react-query";
import { Hydrate } from "react-query/hydration";
import { ReactQueryDevtools } from "react-query/devtools";
import { Toaster } from "react-hot-toast";
import NProgress from "nprogress";
import dayjs from "dayjs";
import * as localizedFormat from "dayjs/plugin/localizedFormat";
import * as relativeTime from "dayjs/plugin/relativeTime";

import "tailwindcss/tailwind.css";
import "_app/styles/nprogress.tailwind.css";

Router.events.on("routeChangeStart", (url) => {
    console.log(`Loading: ${url}`);
    NProgress.start();
});
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

dayjs.extend(localizedFormat.default);
dayjs.extend(relativeTime.default);

const WebApp = ({ Component, pageProps }: AppProps) => {
    const queryClientRef = useRef<QueryClient>();
    if (!queryClientRef.current) {
        queryClientRef.current = new QueryClient();
    }

    return (
        <QueryClientProvider client={queryClientRef.current}>
            <Hydrate state={pageProps.dehydratedState}>
                <EdenUALProviderWithNoSSR>
                    <Component {...pageProps} />
                </EdenUALProviderWithNoSSR>
            </Hydrate>
            <ReactQueryDevtools initialIsOpen={false} />
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        marginTop: "60px",
                    },
                }}
            />
        </QueryClientProvider>
    );
};

const EdenUALProviderWithNoSSR = dynamic(
    () => import("../_app/eos/ual/EdenUALProvider"),
    { ssr: false }
);

export default WebApp;
