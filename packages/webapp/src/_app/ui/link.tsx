import React from "react";
import NextLink from "next/link";

interface Props {
    children: React.ReactNode;
    href?: string;
    className?: string;
    onClick?: () => void;
}

export const Link = ({ children, className, href, onClick }: Props) => {
    const linkClass = `${className || ""} text-yellow-500 hover:underline`;

    return onClick ? (
        <a className={linkClass} href="#" onClick={onClick}>
            {children}
        </a>
    ) : (
        <NextLink href={href!}>
            <a className={linkClass}>{children}</a>
        </NextLink>
    );
};
