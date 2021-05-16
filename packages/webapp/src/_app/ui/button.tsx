import Link from "next/link";
import React from "react";
import { IconType } from "react-icons/lib";

interface Props {
    children: React.ReactNode;
    color?: string;
    icon?: IconType;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    href?: string;
    target?: string;
    outline?: boolean;
    isSubmit?: boolean;
    disabled?: boolean;
    className?: string;
}

const BASE_CLASS =
    "items-center px-6 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none";

export const Button = ({
    children,
    color,
    icon,
    onClick,
    href,
    target,
    outline,
    isSubmit,
    disabled,
    className,
}: Props) => {
    const buttonColor = disabled ? "gray" : color || "yellow";

    const buttonColorBg = outline
        ? "bg-white dark:bg-gray-800"
        : disabled
        ? `bg-gray-300 dark:bg-gray-800`
        : `bg-${buttonColor}-500`;

    const buttonColorBgHover = disabled
        ? ``
        : outline
        ? `hover:bg-${buttonColor}-50`
        : `hover:bg-${buttonColor}-600`;

    const buttonBorderColor = outline
        ? `border-${buttonColor}-300`
        : `border-transparent`;
    const buttonTextColor = outline ? `text-${buttonColor}-600` : `text-white`;

    const buttonCursor = disabled ? "cursor-not-allowed" : "cursor-pointer";

    const buttonClass = [
        BASE_CLASS,
        buttonBorderColor,
        buttonTextColor,
        buttonColorBg,
        buttonColorBgHover,
        buttonCursor,
        className || "",
    ].join(" ");

    const iconOutlineColor = outline ? `text-${color}-500` : "";

    const formattedIcon =
        icon &&
        React.createElement(icon, {
            className: `-ml-1 mr-2 h-5 w-5 ${iconOutlineColor}`,
        });

    const content = (
        <>
            {formattedIcon}
            {children}
        </>
    );

    return href ? (
        <Link href={href}>
            <a className={buttonClass} target={target}>
                {content}
            </a>
        </Link>
    ) : (
        <button
            onClick={onClick}
            type={isSubmit ? "submit" : "button"}
            className={buttonClass}
            disabled={disabled}
        >
            {content}
        </button>
    );
};

export default Button;
