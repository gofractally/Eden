import React from "react";
import NextLink from "next/link";

interface Props {
    children: React.ReactNode;
    href?: string;
    className?: string;
    onClick?: () => void;
    target?: string;
    isExternal?: boolean;
}

export const Link = ({
    children,
    className,
    href,
    target,
    isExternal,
    onClick,
}: Props) => {
    const linkClass = `${
        className || ""
    } text-yellow-500 cursor-pointer hover:underline`;

    let targetProps = {
        target,
        rel: isExternal ? "noopener noreferrer" : undefined,
    };

    return isExternal || onClick ? (
        <a
            className={linkClass}
            href={href || "#"}
            onClick={onClick}
            {...targetProps}
        >
            {children}
        </a>
    ) : (
        <NextLink href={href!}>
            <a className={linkClass} {...targetProps}>
                {children}
            </a>
        </NextLink>
    );
};
