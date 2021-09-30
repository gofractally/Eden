import React, { useState } from "react";
import { IoChevronDownSharp, IoChevronUpSharp } from "react-icons/io5";

import { Container } from "_app";

interface ExpanderProps {
    header: React.ReactNode;
    showContentDivider?: boolean;
    startExpanded?: boolean;
    inactive?: boolean;
    locked?: boolean;
    type?: ExpanderType;
    children: React.ReactNode;
}

export type ExpanderType = "default" | "info" | "inactive";
const TYPES: {
    [key in ExpanderType]: {
        bgColor: string;
        bgColorHover: string;
        bgColorActive: string;
    };
} = {
    default: {
        bgColor: "",
        bgColorHover: "hover:bg-gray-100",
        bgColorActive: "active:bg-gray-200",
    },
    info: {
        bgColor: "bg-blue-50",
        bgColorHover: "hover:bg-blue-100",
        bgColorActive: "active:bg-blue-200",
    },
    inactive: {
        bgColor: "bg-gray-50",
        bgColorHover: "hover:bg-gray-100",
        bgColorActive: "active:bg-gray-200",
    },
};

export const Expander = ({
    header,
    showContentDivider = false,
    startExpanded = false,
    type = "default",
    locked = false,
    children,
}: ExpanderProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(startExpanded);
    const containerClass =
        "flex justify-between items-center group select-none";
    const interactionClass = !locked
        ? `cursor-pointer ${TYPES[type].bgColorHover} ${TYPES[type].bgColorActive}`
        : "";
    const contentDividerClass =
        isExpanded && showContentDivider ? "border-b border-gray-100" : "";

    const onExpand = () => {
        if (locked) return;
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={TYPES[type].bgColor}>
            <Container
                className={`${containerClass} ${interactionClass} ${contentDividerClass}`}
                onClick={onExpand}
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
