import dynamic from "next/dynamic";
import { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

import "tailwindcss/tailwind.css";

const queryClient = new QueryClient();

const WebApp = ({ Component, pageProps }: AppProps) => {
    return (
        <QueryClientProvider client={queryClient}>
            <EdenUALProviderWithNoSSR>
                <Component {...pageProps} />
            </EdenUALProviderWithNoSSR>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
};

const EdenUALProviderWithNoSSR = dynamic(
    () => import("../_app/eos/ual/EdenUALProvider"),
    { ssr: false }
);

export default WebApp;
