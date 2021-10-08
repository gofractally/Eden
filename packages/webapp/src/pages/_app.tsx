import React from "react";
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
import * as timezone from "dayjs/plugin/timezone";
import * as advancedFormat from "dayjs/plugin/advancedFormat";
import {
    useCreateEdenChain,
    EdenChainContext,
} from "@edenos/eden-subchain-client/dist/ReactSubchain";

import { EdenUALProvider, Store, Toaster } from "_app";

import EncryptionPasswordModals from "encryption/components/encryption-password-modals";
import { UalSoftkeyLoginModal } from "_app/eos/ual/softkey";

import "tailwindcss/tailwind.css";
import "_app/styles/nprogress.tailwind.css";
import "_app/styles/add-to-calendar.chq.css";

Router.events.on("routeChangeStart", (url) => {
    console.log(`Loading: ${url}`);
    NProgress.start();
});
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

dayjs.extend(localizedFormat.default);
dayjs.extend(relativeTime.default);
dayjs.extend(advancedFormat.default);
dayjs.extend(timezone.default);

Modal.setAppElement("#__next");

// TODO: reassess this in light of SSR
// if we want to leverage server-side caching, we should consider a refactor
// See more here: https://react-query.tanstack.com/guides/ssr#using-hydration
export const queryClient = new QueryClient();

const WebApp = ({ Component, pageProps }: AppProps) => {
    const subchain = useCreateEdenChain({
        edenAccount: process.env.NEXT_PUBLIC_EDEN_CONTRACT_ACCOUNT!,
        tokenAccount: process.env.NEXT_PUBLIC_TOKEN_CONTRACT!,
        atomicAccount: process.env.NEXT_PUBLIC_AA_CONTRACT!,
        atomicmarketAccount: process.env.NEXT_PUBLIC_AA_MARKET_CONTRACT!,
        wasmResponse: fetch(process.env.NEXT_PUBLIC_SUBCHAIN_WASM_URL!),
        stateResponse: fetch(
            process.env.NEXT_PUBLIC_SUBCHAIN_SLOW_MO === "true"
                ? "bad_state_file_name_for_slow_mo"
                : process.env.NEXT_PUBLIC_SUBCHAIN_STATE_URL!
        ),
        blocksUrl: process.env.NEXT_PUBLIC_SUBCHAIN_WS_URL!,
        slowmo: process.env.NEXT_PUBLIC_SUBCHAIN_SLOW_MO === "true",
    });
    return (
        <EdenChainContext.Provider value={subchain}>
            <Store.StateProvider>
                <QueryClientProvider client={queryClient}>
                    <Hydrate state={pageProps.dehydratedState}>
                        <EdenUALProvider>
                            <EncryptionPasswordModals />
                            <UalSoftkeyLoginModal />
                            <Component {...pageProps} />
                        </EdenUALProvider>
                    </Hydrate>
                    <ReactQueryDevtools initialIsOpen={false} />
                    <Toaster />
                </QueryClientProvider>
            </Store.StateProvider>
        </EdenChainContext.Provider>
    );
};

export default WebApp;
