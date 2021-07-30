import React, { useRef } from "react";
import { AppProps } from "next/app";
import Router from "next/router";
import { QueryClient, QueryClientProvider } from "react-query";
import { Hydrate } from "react-query/hydration";
import { ReactQueryDevtools } from "react-query/devtools";
import NProgress from "nprogress";
import Modal from "react-modal";
import dayjs from "dayjs";
import * as localizedFormat from "dayjs/plugin/localizedFormat";
import * as relativeTime from "dayjs/plugin/relativeTime";

import { EdenUALProvider, Toaster } from "_app";

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

Modal.setAppElement("#__next");

// TODO: reassess this in light of SSR
// if we want to leverage server-side caching, we should consider a refactor
// See more here: https://react-query.tanstack.com/guides/ssr#using-hydration
export const queryClient = new QueryClient();

const WebApp = ({ Component, pageProps }: AppProps) => (
    <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
            <EdenUALProvider>
                <Component {...pageProps} />
            </EdenUALProvider>
        </Hydrate>
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster />
    </QueryClientProvider>
);

export default WebApp;
