import React from "react";
import { IconType } from "react-icons/lib";

import { OpensInNewTabIcon } from "_app";

interface Props {
    handle: string;
    href: string;
    icon: IconType;
    className?: string;
}

const BUTTON_BASE_CLASS =
    "hover:underline p-1 flex-grow flex flex-wrap text-black-500";
const ICON_CLASS = "w-5 h-5 inline-flex mr-3";

export const SocialButton = ({ handle, icon, href, className }: Props) => {
    const buttonClass = `${className || ""} ${BUTTON_BASE_CLASS}`;

    const formattedIcon = React.createElement(icon, {
        className: ICON_CLASS,
    });

    return (
        <a
            href={href}
            className={buttonClass}
            target="_blank"
            rel="noopener noreferrer"
        >
            <div className="flex items-center">
                {formattedIcon}
                <span>{handle}</span>
            </div>
            <OpensInNewTabIcon />
        </a>
    );
};

export default SocialButton;
