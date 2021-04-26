import Head from "next/head";

import { HeaderNav, Heading } from "../ui";

interface Props {
    title?: string;
    children: React.ReactNode;
}

export const RawLayout = ({ children, title }: Props) => (
    <div className="bg-gray-0 min-h-screen">
        <HeaderNav />
        <Head>
            <title>{title && `${title} | `} Eden</title>
        </Head>
        {title && (
            <div className="px-8 pt-8">
                <Heading>{title}</Heading>
                <hr />
            </div>
        )}
        {children}
    </div>
);
