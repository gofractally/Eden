import React from "react";

export type TextType = "regular" | "note" | "danger" | "info";
const TYPES: { [key in TextType]: string } = {
    regular: "text-gray-700",
    note: "text-gray-500",
    danger: "text-red-500",
    info: "text-blue-500",
};

export type TextSize = "xs" | "sm" | "base" | "lg" | "inherit";
const SIZES: { [key in TextSize]: string } = {
    xs: "text-xs leading-5",
    sm: "text-sm leading-5",
    base: "text-base leading-5 tracking-tight",
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
