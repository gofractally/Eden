import React from "react";
import { useVirtual } from "react-virtual";

import { MemberData } from "members";

interface Props {
    members: MemberData[];
    height: number;
    header?: React.ReactNode;
    dataTestId?: string;
    children(member: MemberData): React.ReactNode;
}

export const VirtualMembersList = ({
    members,
    height,
    header,
    dataTestId,
    children,
}: Props) => {
    const parentRef = React.useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtual({
        size: members.length,
        parentRef,
        estimateSize: React.useCallback(() => 77, []),
        overscan: 10,
        paddingEnd: 40,
    });

    return (
        <div
            ref={parentRef}
            className="overflow-auto"
            style={{
                height,
            }}
        >
            {header}
            <div
                className="w-full relative"
                data-testid={dataTestId}
                style={{
                    height: `${rowVirtualizer.totalSize}px`,
                }}
            >
                {rowVirtualizer.virtualItems.map((item) => (
                    <div
                        key={item.index}
                        className="absolute top-0 left-0 w-full"
                        style={{
                            height: `${item.size}px`,
                            transform: `translateY(${item.start}px)`,
                        }}
                    >
                        {children(members[item.index])}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VirtualMembersList;
