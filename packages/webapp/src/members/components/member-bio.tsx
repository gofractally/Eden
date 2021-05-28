import React, { useState } from "react";

interface Props {
    bio: string;
}

export const MemberBio = ({ bio }: Props) => {
    const [expanded, setExpanded] = useState(false);
    const TRUNCATION_THRESHOLD_IN_CHARS = 310;
    const shouldTruncate = bio.length > TRUNCATION_THRESHOLD_IN_CHARS;

    const toggleExpanded = (e: React.MouseEvent) => {
        e.preventDefault();
        setExpanded((prevState) => !prevState);
    };

    const truncatedBio =
        bio
            .substr(0, TRUNCATION_THRESHOLD_IN_CHARS)
            .split(" ")
            .slice(0, -1) // don't leave a partial word dangling
            .join(" ") + "... ";

    const renderContent = () => {
        if (!shouldTruncate) return bio;
        return (
            <>
                <span>
                    {expanded || !shouldTruncate ? bio + " " : truncatedBio}
                </span>
                {expanded ? (
                    <a
                        href="#"
                        onClick={toggleExpanded}
                        className="text-sm underline hover:text-gray-500 transition"
                    >
                        show less
                    </a>
                ) : (
                    <a
                        href="#"
                        onClick={toggleExpanded}
                        className="text-sm underline hover:text-gray-500 transition"
                    >
                        read more
                    </a>
                )}
            </>
        );
    };

    return (
        <>
            <h4 className="font-semibold text-xl">Member Profile Statement</h4>
            <p className="text-gray-900 pt-2 break-words">{renderContent()}</p>
        </>
    );
};
