import React from "react";
import { Container, Heading } from "_app";

interface Props {
    className?: string;
    children: React.ReactNode;
}

export const LevelHeading = ({ className = "", children }: Props) => (
    <Container className={`py-2.5 ${className}`}>
        <Heading size={2}>{children}</Heading>
    </Container>
);
