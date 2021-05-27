import React from "react";
import { IconType } from "react-icons/lib";

interface Props {
    handle: string;
    href: string;
    icon: IconType;
    className?: string;
}

const BUTTON_BASE_CLASS =
    "hover:underline space-x-3 p-1 flex-grow flex flex-wrap text-black-500";
const ICON_CLASS = "w-5 h-5 inline-flex";

export const SocialButton = ({ handle, icon, href, className }: Props) => {
    const buttonClass = `${className || ""} ${BUTTON_BASE_CLASS}`;

    const formattedIcon = React.createElement(icon, {
        className: ICON_CLASS,
    });

    return (
        <a href={href} className={buttonClass} target="_blank">
            {formattedIcon}
            <span>{handle}</span>
        </a>
    );
};

export default SocialButton;
