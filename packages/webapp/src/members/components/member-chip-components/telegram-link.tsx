import React from "react";
import { FaTelegram } from "react-icons/fa";

import { openInNewTab } from "_app";
import { OpensInNewTabIcon } from "_app/ui";
import { getValidSocialLink } from "members/helpers/social-links";

export const MemberChipTelegramLink = ({
    handle,
    className = "",
}: {
    handle?: string;
    className?: string;
}) => {
    const parsedHandle = getValidSocialLink(handle);
    if (!parsedHandle) return null;

    const goToTelegram = (e: React.MouseEvent) => {
        e.stopPropagation();
        openInNewTab(`https://t.me/${parsedHandle}`);
    };

    return (
        <div onClick={goToTelegram} className={className}>
            <p className="flex items-center text-xs text-gray-500 hover:text-gray-600 transition font-light hover:underline">
                <FaTelegram className="mr-1" />
                {parsedHandle}
                <OpensInNewTabIcon size={8} className="mb-1.5" />
            </p>
        </div>
    );
};

export default MemberChipTelegramLink;
