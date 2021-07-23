import React from "react";

interface Props {
    children: React.ReactNode;
    size?: 1 | 2 | 3 | 4;
    className?: string;
}

export const Heading = ({ children, size, className }: Props) => {
    let element = "";
    let textClass = "";

    switch (size) {
        case 2:
            element = "h2";
            textClass = "text-2xl tracking-tight";
            break;
        case 3:
            element = "h3";
            textClass = "text-xl tracking-tight";
            break;
        case 4:
            element = "h4";
            textClass = "text-lg tracking-tight";
            break;
        case 1:
        default:
            element = "h1";
            textClass = "text-3xl tracking-tight";
    }

    const headingClassName = `${textClass} font-semibold text-gray-800 ${
        className || ""
    }`;

    return React.createElement(element, {
        className: headingClassName,
        children,
    });
};
