import React from "react";
import NextLink from "next/link";

interface Props {
    children: React.ReactNode;
    href: string;
    className?: string;
}

export const Link = ({ children, className, href }: Props) => {
    const linkClass = `${className || ""} text-yellow-500 hover:underline`;

    return (
        <NextLink href={href}>
            <a className={linkClass}>{children}</a>
        </NextLink>
    );
};
