import Head from "next/head";

import { HeaderNav, Footer } from "../ui";

interface Props {
    title?: string;
    children: React.ReactNode;
}

export const FluidLayout = ({ children, title }: Props) => (
    <div className="flex flex-col min-h-screen">
        <HeaderNav />
        <Head>
            <title>{title && `${title} | `} Eden</title>
        </Head>
        <main className="xl:container xl:mx-auto flex-grow">{children}</main>
        <Footer />
    </div>
);
