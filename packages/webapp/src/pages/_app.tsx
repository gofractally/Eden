import dynamic from "next/dynamic";
import { AppProps } from "next/app";

import "tailwindcss/tailwind.css";

const WebApp = ({ Component, pageProps }: AppProps) => {
    return (
        <EdenUALProviderWithNoSSR>
            <Component {...pageProps} />
        </EdenUALProviderWithNoSSR>
    );
};

const EdenUALProviderWithNoSSR = dynamic(
    () => import("../_app/eos/ual/EdenUALProvider"),
    { ssr: false }
);

export default WebApp;
