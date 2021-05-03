import dynamic from "next/dynamic";
import { AppProps } from "next/app";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { Toaster } from "react-hot-toast";

import "tailwindcss/tailwind.css";

const queryClient = new QueryClient();

const WebApp = ({ Component, pageProps }: AppProps) => {
    return (
        <QueryClientProvider client={queryClient}>
            <EdenUALProviderWithNoSSR>
                <Component {...pageProps} />
            </EdenUALProviderWithNoSSR>
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
