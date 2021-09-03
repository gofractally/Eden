import React, { useState } from "react";
import { IoChevronDownSharp, IoChevronUpSharp } from "react-icons/io5";

import { Container } from "_app";

interface ExpanderProps {
    header: React.ReactNode;
    showContentDivider?: boolean;
    startExpanded?: boolean;
    darkBg?: boolean;
    inactive?: boolean;
    locked?: boolean;
    children: React.ReactNode;
}

export const Expander = ({
    header,
    showContentDivider = false,
    startExpanded = false,
    darkBg,
    inactive,
    locked = false,
    children,
}: ExpanderProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(startExpanded);
    const containerClass =
        "flex justify-between items-center group select-none";
    const interactionClass = !locked
        ? "cursor-pointer hover:bg-gray-100 active:bg-gray-200"
        : "";
    const contentDividerClass =
        isExpanded && showContentDivider ? "border-b border-gray-100" : "";

    const onExpand = () => {
        if (locked) return;
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={darkBg || inactive ? "bg-gray-50" : ""}>
            <Container
                className={`${containerClass} ${interactionClass} ${contentDividerClass}`}
                onClick={onExpand}
                darkBg={darkBg || inactive}
            >
                {header}
                <ExpansionIndicator isExpanded={isExpanded} locked={locked} />
            </Container>
            {isExpanded && children}
        </div>
    );
};

const ExpansionIndicator = ({
    isExpanded,
    locked,
}: {
    isExpanded: boolean;
    locked: boolean;
}) => {
    if (locked) return <></>;
    if (isExpanded)
        return (
            <IoChevronUpSharp
                size={19}
                className="text-gray-500 group-hover:text-gray-500 active:text-gray-600"
            />
        );
    return (
        <IoChevronDownSharp
            size={19}
            className="text-gray-500 group-hover:text-gray-500 active:text-gray-600"
        />
    );
};

export default Expander;
