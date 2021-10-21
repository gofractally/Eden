import React, { CSSProperties } from "react";
import { Container, Heading } from "_app";

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
