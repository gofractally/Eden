import React from "react";

import { Button, Container, useCurrentMember, useUALAccount } from "_app";

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
    const { data: currentMember } = useCurrentMember();

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
