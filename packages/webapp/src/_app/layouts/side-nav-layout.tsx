import Head from "next/head";

import { MobileNav, SideNav, Footer } from "../ui";

interface Props {
    title?: string;
    children: React.ReactNode;
    banner?: React.ReactNode;
    hideFooter?: boolean;
    onClickTopNavBar?: () => void;
    className?: string;
}

export const SideNavLayout = ({
    children,
    title,
    banner,
    hideFooter = false,
    onClickTopNavBar,
    className = "",
}: Props) => (
    <div className="flex flex-col xs:flex-row min-h-screen w-full container max-w-screen-xl mx-auto border-r">
        <Head>
            <title>{title && `${title} | `} Eden</title>
        </Head>
        <SideNav />
        <MobileNav onClick={onClickTopNavBar} />
        <div className="flex-1 flex flex-col w-full mt-14 xs:mt-0 pb-16 xs:pb-0">
            <div className="flex-1 flex flex-col">
                {banner}
                <main className={className}>{children}</main>
            </div>
            {!hideFooter && <Footer />}
        </div>
    </div>
);
