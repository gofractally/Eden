import React from "react";

import * as layoutConstants from "_app/layouts/constants";
import { useWindowSize } from "_app/hooks";
import { PageHeader, SearchControl, SearchProps } from "_app/ui";

// TODO: Extrapolate to generic app component when opportunity for reuse arises.

export const CommunityHeadersWithSearch = (props: SearchProps) => (
    <>
        <CommunityHeaderWithSearch
            className="hidden lg:flex sticky top-0 z-10"
            {...props}
        />
        <PageHeader header="Community" className="lg:hidden" />
        <InlineStickySearch {...props} className="lg:hidden" />
    </>
);

export const CommunityHeaderWithSearch = ({
    id,
    onClear,
    onChange,
    value,
    className,
}: SearchProps) => (
    <PageHeader
        header="Community"
        className={`flex items-center justify-between w-full border-b bg-white ${className}`}
        style={{
            height: 76,
            paddingTop: 0,
            paddingBottom: 0,
        }}
    >
        <div className="h-14 relative flex justify-end flex-1 max-w-md overflow-hidden">
            <div className={`search-expander ${value && "expanded"}`}>
                <SearchControl
                    id={id}
                    value={value}
                    onChange={onChange}
                    onClear={onClear}
                />
            </div>
            <style jsx>{`
                .search-expander {
                    position: absolute;
                    transition: width 0.3s ease;
                    width: 32px;
                    overflow: hidden;
                }
                .search-expander:focus-within {
                    width: 100%;
                }
                .search-expander.expanded {
                    width: 100%;
                }
            `}</style>
        </div>
    </PageHeader>
);

export const InlineStickySearch = ({
    id,
    onClear,
    onChange,
    value,
    className,
}: SearchProps) => {
    const { width: windowWidth } = useWindowSize();
    return (
        <div
            className={`sticky z-10 bg-white ${className}`}
            style={{
                boxShadow: "0 0 0 1px #e5e5e5",
                top:
                    (windowWidth ?? 0) < layoutConstants.breakpoints.xs
                        ? layoutConstants.navigation.mobileTopNavHeight - 1
                        : 0,
            }}
        >
            <SearchControl
                id={id}
                value={value}
                onChange={onChange}
                onClear={onClear}
            />
        </div>
    );
};
