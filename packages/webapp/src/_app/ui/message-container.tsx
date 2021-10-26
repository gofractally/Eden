import React from "react";
import { Container, Heading, Text } from "_app/ui";

interface Props {
    title: string;
    message: string;
}

export const MessageContainer = ({ title, message }: Props) => (
    <Container className="flex flex-col justify-center items-center py-16 text-center">
        <Heading size={4}>{title}</Heading>
        <Text>{message}</Text>
    </Container>
);

export default MessageContainer;
