import React, { useState } from "react";
import { IoChevronDownSharp, IoChevronUpSharp } from "react-icons/io5";

import { Container } from "_app";

interface ExpanderProps {
    header: React.ReactNode;
    hideContentDivider?: boolean;
    startExpanded?: boolean;
    children: React.ReactNode;
}

export const Expander = ({
    header,
    hideContentDivider,
    startExpanded = false,
    children,
}: ExpanderProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(startExpanded);
    const containerClass =
        "flex justify-between items-center group cursor-pointer hover:bg-gray-100 active:bg-gray-200 select-none";
    const contentDividerClass =
        !isExpanded || hideContentDivider ? "" : "border-b border-gray-100";
    return (
        <div>
            <Container
                className={`${containerClass} ${contentDividerClass}`}
                onClick={() => setIsExpanded(!isExpanded)}
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
