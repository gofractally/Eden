import React, { CSSProperties } from "react";
import { Container, Heading } from "_app";

interface Props {
    className?: string;
    style?: CSSProperties;
    children?: React.ReactNode;
}

export const CommunityHeader = ({ className = "", style, children }: Props) => (
    <Container className={className} style={style}>
        <Heading size={1}>Community</Heading>
        {children}
    </Container>
);

export default CommunityHeader;
