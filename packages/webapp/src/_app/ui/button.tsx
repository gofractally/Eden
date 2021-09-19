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
    title?: string;
    dataTestId?: string;
}

export type ButtonSize = "sm" | "md" | "lg";
const SIZES: { [key in ButtonSize]: string } = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-1.5 px-5",
    lg: "py-3 px-6 text-lg",
};

export type ButtonType =
    | "primary"
    | "disabled"
    | "neutral"
    | "caution"
    | "danger"
    | "dangerOutline"
    | "inductionStatusProfile"
    | "inductionStatusCeremony"
    | "inductionStatusAction"
    | "link";
const TYPES: { [key in ButtonType]: string } = {
    primary: "bg-blue-500 border-blue-500 text-white hover:bg-blue-600",
    disabled: "border-gray-300 bg-gray-300 text-white",
    neutral: "bg-gray-50 text-gray-800 hover:bg-gray-200",
    caution: "bg-yellow-500 text-white hover:bg-yellow-600 border-white",
    danger: "bg-red-500 text-white hover:bg-red-600",
    dangerOutline: "text-gray-500 hover:text-red-500 border-none",
    link: "border-transparent text-blue-500 hover:text-blue-600",
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
    title,
    dataTestId,
}: Props) => {
    const baseClass = "inline-block border focus:outline-none text-center";
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
                title={title}
                data-testid={dataTestId}
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
                title={title}
                data-testid={dataTestId}
            >
                {buttonContents()}
            </a>
        );
    }

    return (
        <NextLink href={href}>
            <a
                className={buttonClass}
                target={target}
                data-testid={dataTestId}
                title={title}
            >
                {buttonContents()}
            </a>
        </NextLink>
    );
};
