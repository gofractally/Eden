import React, { useState } from "react";
import { IoChevronDownSharp, IoChevronUpSharp } from "react-icons/io5";

import { Container } from "_app";

interface ExpanderProps {
    header: React.ReactNode;
    showContentDivider?: boolean;
    startExpanded?: boolean;
    inactive?: boolean;
    children: React.ReactNode;
}

export const Expander = ({
    header,
    showContentDivider = false,
    startExpanded = false,
    inactive,
    children,
}: ExpanderProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(startExpanded);
    const containerClass =
        "flex justify-between items-center group cursor-pointer hover:bg-gray-100 active:bg-gray-200 select-none";
    const contentDividerClass =
        isExpanded && showContentDivider ? "border-b border-gray-100" : "";
    return (
        <div className={inactive ? "bg-gray-50" : ""}>
            <Container
                className={`${containerClass} ${contentDividerClass}`}
                onClick={() => setIsExpanded(!isExpanded)}
                darkBg={inactive}
            >
                {header}
                {isExpanded ? (
                    <IoChevronUpSharp
                        size={19}
                        className="text-gray-500 group-hover:text-gray-500 active:text-gray-600"
                    />
                ) : (
                    <IoChevronDownSharp
                        size={19}
                        className="text-gray-500 group-hover:text-gray-500 active:text-gray-600"
                    />
                )}
            </Container>
            {isExpanded && children}
        </div>
    );
};

export default Expander;
