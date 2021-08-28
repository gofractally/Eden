import Head from "next/head";

import { SideNav, Footer } from "../ui";

interface Props {
    title?: string;
    children: React.ReactNode;
    hideBorders?: boolean;
    banner?: React.FC;
}

export const SideNavLayout = ({
    children,
    title,
    hideBorders,
    banner,
}: Props) => (
    <div className="flex h-screen w-full container max-w-screen-xl mx-auto">
        <Head>
            <title>{title && `${title} | `} Eden</title>
        </Head>
        {banner}
        <header className="w-24 md:w-32 lg:w-48 xl:w-56">
            <SideNav />
        </header>
        <div className="flex-1 flex flex-col w-full">
            <main className="max-w-4xl">
                <div className={hideBorders ? "" : "border-b border-r"}>
                    {children}
                </div>
            </main>
            {/* <Footer /> */}
        </div>
    </div>
);
