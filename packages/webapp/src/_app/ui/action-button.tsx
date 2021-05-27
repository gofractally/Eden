import React from "react";
import NextLink from "next/link";
import { FaSpinner } from "react-icons/fa";

interface Props {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    type?: ActionButtonType;
    isSubmit?: boolean;
    disabled?: boolean;
    isLoading?: boolean;
    size?: ActionButtonSize;
    fullWidth?: boolean;
    className?: string;
    href?: string;
    target?: string;
    isExternal?: boolean;
}

export enum ActionButtonSize {
    S = "py-1.5 px-3 text-sm rounded",
    M = "py-1.5 px-5 font-medium rounded-md",
    L = "py-3 px-6 rounded-md text-lg",
}

export enum ActionButtonType {
    Primary = "bg-blue-500 border-blue-500 text-white hover:bg-blue-600",
    Disabled = "border-gray-400 bg-gray-300 text-gray-500",
    Neutral = "bg-gray-50 text-gray-800 hover:bg-gray-200",
    Danger = "bg-red-500 text-white hover:bg-red-600",
    InductionStatusProfile = "bg-blue-500 border-blue-500 text-white hover:bg-blue-600",
    InductionStatusCeremony = "bg-blue-500 border-blue-500 text-white hover:bg-blue-600",
    InductionStatusAction = "bg-green-500 text-white hover:bg-green-600",
}
/**
 * ActionButton Best Practices:
 *
 * Try to use a type (ActionButtonType enum) to select colors.
 * If your type isn't there, create it. But we should have a bounded number of button types.
 * Avoid adding colors to the component below directly. Color overriding can easily break.
 * Override button size using size (ActionButtonSize).
 *
 * In this way, if we need a button, we know we can usually rely on ActionButton. And we
 * have a menu of button options to choose from.
 */
export const ActionButton = ({
    children,
    onClick,
    isSubmit,
    disabled,
    type = ActionButtonType.Primary,
    size = ActionButtonSize.M,
    fullWidth,
    isLoading,
    className = "",
    href = "#",
    target,
    isExternal,
}: Props) => {
    const baseClass = "inline-block border focus:outline-none";
    const widthClass = fullWidth ? "w-full" : "";
    let colorClass = disabled ? ActionButtonType.Disabled : type;
    const cursorClass = disabled ? "cursor-not-allowed" : "cursor-pointer";
    const buttonClass = `${baseClass} ${size} ${widthClass} ${colorClass} ${cursorClass} ${className}`;

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
