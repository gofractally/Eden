import Head from "next/head";

import { HeaderNav, Heading } from "../ui";

interface Props {
    title?: string;
    children: React.ReactNode;
}

export const RawLayout = ({ children, title }: Props) => (
    <div className="bg-gray-50 min-h-screen">
        <HeaderNav />
        <Head>
            <title>{title && `${title} | `} Eden</title>
        </Head>
        <div className="md:container md:mx-auto pt-8 px-4">
            {title && (
                <>
                    <Heading>{title}</Heading>
                    <hr />
                </>
            )}
            {children}
        </div>
    </div>
);
