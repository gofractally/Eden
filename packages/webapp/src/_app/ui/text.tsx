import React from "react";

export type TextType = "regular" | "note";
const TYPES: { [key in TextType]: string } = {
    regular: "text-gray-600",
    note: "text-gray-500",
};

export type TextSize = "base" | "md" | "xs";
const SIZES: { [key in TextSize]: string } = {
    base: "text-base",
    md: "text-xs",
    xs: "text-md",
};

interface Props {
    children: React.ReactNode;
    type?: TextType;
    size?: TextSize;
    className?: string;
}

export const Text = ({
    children,
    className,
    type = "regular",
    size = "base",
}: Props) => {
    const textClass = `${TYPES[type]} ${SIZES[size]} ${className || ""}`;
    return <p className={textClass}>{children}</p>;
};
