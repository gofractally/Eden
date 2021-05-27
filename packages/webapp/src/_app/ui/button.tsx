import React from "react";
import NextLink from "next/link";
import { FaSpinner } from "react-icons/fa";

interface Props {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    type?: ButtonType;
    isSubmit?: boolean;
    disabled?: boolean;
    isLoading?: boolean;
    size?: ButtonSize;
    fullWidth?: boolean;
    className?: string;
    href?: string;
    target?: string;
    isExternal?: boolean;
}

export type ButtonSize = "sm" | "md" | "lg";
const SIZES: { [key in ButtonSize]: string } = {
    sm: "py-1.5 px-3 text-sm rounded",
    md: "py-1.5 px-5 font-medium rounded-md",
    lg: "py-3 px-6 rounded-md text-lg",
};

export type ButtonType =
    | "primary"
    | "disabled"
    | "neutral"
    | "danger"
    | "inductionStatusProfile"
    | "inductionStatusCeremony"
    | "inductionStatusAction";
const TYPES: { [key in ButtonType]: string } = {
    primary: "bg-blue-500 border-blue-500 text-white hover:bg-blue-600",
    disabled: "border-gray-400 bg-gray-300 text-gray-500",
    neutral: "bg-gray-50 text-gray-800 hover:bg-gray-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
    inductionStatusProfile:
        "bg-blue-500 border-blue-500 text-white hover:bg-blue-600",
    inductionStatusCeremony:
        "bg-blue-500 border-blue-500 text-white hover:bg-blue-600",
    inductionStatusAction: "bg-green-500 text-white hover:bg-green-600",
};

/**
 * Button Best Practices:
 *
 * Try to use a type (ButtonType) to select colors.
 * If your type isn't there, create it. But we should have a bounded number of button types.
 * Avoid adding colors to the component below directly. Color overriding can easily break.
 * Override button size using size (ButtonSize).
 *
 * In this way, if we need a button, we know we can usually rely on Button. And we
 * have a menu of button options to choose from.
 */
export const Button = ({
    children,
    onClick,
    isSubmit,
    disabled,
    type = "primary",
    size = "md",
    fullWidth,
    isLoading,
    className = "",
    href = "#",
    target,
    isExternal,
}: Props) => {
    const baseClass = "inline-block border focus:outline-none";
    const widthClass = fullWidth ? "w-full" : "";
    let colorClass = TYPES[disabled ? "disabled" : type];
    const cursorClass = disabled ? "cursor-not-allowed" : "cursor-pointer";
    const buttonClass = `${baseClass} ${SIZES[size]} ${widthClass} ${colorClass} ${cursorClass} ${className}`;

    const buttonContents = () => (
        <div className="flex items-center justify-center">
            {isLoading && <FaSpinner className="animate-spin mr-2" />}
            {children}
        </div>
    );

    if (isSubmit || onClick) {
        return (
            <button
                onClick={onClick}
                type={isSubmit ? "submit" : "button"}
                className={buttonClass}
                disabled={disabled}
            >
                {buttonContents()}
            </button>
        );
    }

    if (isExternal) {
        return (
            <a
                className={buttonClass}
                href={href}
                rel="noopener noreferrer"
                target={target}
            >
                {buttonContents()}
            </a>
        );
    }

    return (
        <NextLink href={href}>
            <a className={buttonClass} target={target}>
                {buttonContents()}
            </a>
        </NextLink>
    );
};
