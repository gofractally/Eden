import { AppProps } from "next/app";

import "tailwindcss/tailwind.css";

const WebApp = ({ Component, pageProps }: AppProps) => {
    return <Component {...pageProps} />;
};

export default WebApp;
