import React from "react";
import { Container, Heading } from "_app";

export const LevelHeading = ({ children }: { children: React.ReactNode }) => (
    <Container className="py-2.5">
        <Heading size={2}>{children}</Heading>
    </Container>
);
