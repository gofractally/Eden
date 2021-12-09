import React, { CSSProperties } from "react";
import { Container, Heading, SearchControl, SearchProps } from "_app/ui";
import { useWindowSize } from "_app/hooks";

import * as layoutConstants from "_app/layouts/constants";

interface Props {
    header: string;
    className?: string;
    style?: CSSProperties;
    children?: React.ReactNode;
}

export const PageHeader = ({
    header,
    className = "",
    style,
    children,
}: Props) => (
    <Container className={className} style={style}>
        <Heading size={1}>{header}</Heading>
        {children}
    </Container>
);

export default PageHeader;

interface PageSearchHeaderProps extends SearchProps {
    header: string;
}

export const PageSearchHeaders = ({
    header,
    ...props
}: PageSearchHeaderProps) => (
    <>
        <PageHeaderWithSearch
            header={header}
            className="hidden lg:flex sticky top-0 z-10"
            {...props}
        />
        <PageHeader header={header} className="lg:hidden" />
        <InlineStickySearch {...props} className="lg:hidden" />
    </>
);

const PageHeaderWithSearch = ({
    header,
    id,
    onClear,
    onChange,
    value,
    className,
}: PageSearchHeaderProps) => (
    <PageHeader
        header={header}
        className={`flex items-center justify-between w-full border-b bg-white ${className}`}
        style={{
            height: 76,
            paddingTop: 0,
            paddingBottom: 0,
        }}
    >
        <div className="h-14 relative flex justify-end flex-1 max-w-md overflow-hidden">
            <div
                className={`absolute overflow-hidden w-8 focus-within:w-full ${
                    value && "w-full"
                } transition-all`}
            >
                <SearchControl
                    id={id}
                    value={value}
                    onChange={onChange}
                    onClear={onClear}
                />
            </div>
        </div>
    </PageHeader>
);

const InlineStickySearch = ({
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
