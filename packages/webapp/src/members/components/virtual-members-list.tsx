import React from "react";
import { useVirtual } from "react-virtual";

import { MemberData } from "members";
import { ActionType, useReduxEvent } from "_app";

interface Props {
    members: MemberData[];
    height: number;
    header?: React.ReactNode;
    dataTestId?: string;
    children(member: MemberData): React.ReactNode;
}

function easeInOutQuint(t: number) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
}

export const VirtualMembersList = ({
    members,
    height,
    header,
    dataTestId,
    children,
}: Props) => {
    const parentRef = React.useRef<HTMLDivElement>(null);
    const scrollingRef = React.useRef<number | null>(null);

    const scrollToFn = React.useCallback((offset, defaultScrollTo) => {
        const duration = 500;
        if (!parentRef?.current) return null;
        const start = parentRef.current.scrollTop;
        const startTime = (scrollingRef.current = Date.now());

        const run = () => {
            if (scrollingRef.current !== startTime) return;
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = easeInOutQuint(Math.min(elapsed / duration, 1));
            const interpolated = start + (offset - start) * progress;

            if (elapsed < duration) {
                defaultScrollTo(interpolated);
                requestAnimationFrame(run);
            } else {
                defaultScrollTo(interpolated);
            }
        };

        requestAnimationFrame(run);
    }, []);

    const rowVirtualizer = useVirtual({
        size: members.length,
        parentRef,
        estimateSize: React.useCallback(() => 77, []),
        overscan: 10,
        paddingEnd: 40,
        scrollToFn,
    });

    useReduxEvent(ActionType.EventDidTapMobileAppHeader, () =>
        rowVirtualizer.scrollToIndex(0)
    );

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
