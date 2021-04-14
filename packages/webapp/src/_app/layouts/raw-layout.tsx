import Head from "next/head";

import { Heading } from "../ui";

interface Props {
    title?: string;
    children: React.ReactNode;
}

export const RawLayout = ({ children, title }: Props) => (
    <div className="bg-gray-50 min-h-screen">
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
