import Head from "next/head";

import { MobileNav, SideNav, Footer } from "../ui";

interface Props {
    title?: string;
    children: React.ReactNode;
    banner?: React.ReactNode;
    className?: string;
}

export const SideNavLayout = ({
    children,
    title,
    banner,
    className = "",
}: Props) => (
    <div className="flex flex-col xs:flex-row h-screen w-full container max-w-screen-xl mx-auto">
        <Head>
            <title>{title && `${title} | `} Eden</title>
        </Head>
        {banner}
        <SideNav />
        <MobileNav />
        <div className="flex-1 flex flex-col w-full mt-12 xs:mt-0 pb-16 xs:pb-0">
            <main className={`min-h-screen border-r ${className}`}>
                {children}
            </main>
            {/* <Footer /> */}
        </div>
    </div>
);
