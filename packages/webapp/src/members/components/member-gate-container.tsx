import React from "react";

import { useCurrentMember, useUALAccount } from "_app";
import { Button, Container, LoadingContainer } from "_app/ui";

export interface Props {
    children: React.ReactNode;
    signinLabel?: string;
    joinLabel?: string;
}

export const MemberGateContainer = ({
    signinLabel,
    joinLabel,
    children,
}: Props) => {
    const [ualAccount, _, ualShowModal] = useUALAccount();
    const { data: currentMember, isLoading } = useCurrentMember();

    if (isLoading) return <LoadingContainer />;

    if (!ualAccount) {
        return (
            <Container>
                <Button onClick={ualShowModal}>
                    {signinLabel || "Sign In"}
                </Button>
            </Container>
        );
    } else if (!currentMember) {
        return (
            <Container>
                <Button href="/induction">{joinLabel || "Join Eden"}</Button>
            </Container>
        );
    } else {
        return <>{children}</>;
    }
};
