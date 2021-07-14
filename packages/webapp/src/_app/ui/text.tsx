import React from "react";

export type TextType = "regular" | "note";
const TYPES: { [key in TextType]: string } = {
    regular: "text-gray-700",
    note: "text-gray-500",
};

export type TextSize = "xs" | "sm" | "base" | "lg" | "inherit";
const SIZES: { [key in TextSize]: string } = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    inherit: "",
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
