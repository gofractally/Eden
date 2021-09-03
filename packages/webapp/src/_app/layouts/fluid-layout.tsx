import Head from "next/head";

import { HeaderNav, Footer } from "../ui";

interface Props {
    title?: string;
    children: React.ReactNode;
    hideBorders?: boolean;
    banner?: React.ReactNode;
}

export const FluidLayout = ({
    children,
    title,
    hideBorders,
    banner,
}: Props) => (
    <div className="flex flex-col min-h-screen">
        <HeaderNav />
        <Head>
            <title>{title && `${title} | `} Eden</title>
        </Head>
        {banner}
        <main className="flex-grow">
            <div className="max-w-screen-xl mx-auto">
                <div
                    className={
                        hideBorders ? "" : "border-b xl:border-l xl:border-r"
                    }
                >
                    {children}
                </div>
            </div>
        </main>
        <Footer />
    </div>
);
