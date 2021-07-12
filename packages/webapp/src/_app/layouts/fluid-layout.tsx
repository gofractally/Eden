import Head from "next/head";

import { HeaderNav, Footer } from "../ui";

interface Props {
    title?: string;
    children: React.ReactNode;
    hideBorders?: boolean;
}

export const FluidLayout = ({ children, title, hideBorders }: Props) => (
    <div className="flex flex-col min-h-screen">
        <HeaderNav />
        <Head>
            <title>{title && `${title} | `} Eden</title>
        </Head>
        <main className="flex-grow">
            <div className="max-w-screen-xl mx-auto">
                <div
                    className={
                        hideBorders ? "lg:mx-5" : "lg:mx-5 border border-t-0"
                    }
                >
                    {children}
                </div>
            </div>
        </main>
        <Footer />
    </div>
);
