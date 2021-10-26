import React from "react";
import { useRouter } from "next/router";

import {
    Container,
    SideNavLayout,
    LoadingContainer,
    Heading,
    MessageContainer,
} from "_app";
import {
    MemberCard,
    MemberCollections,
    MemberData,
    MemberHoloCard,
    useMemberByAccountName,
} from "members";
import { DelegateFundsAvailable } from "delegates/components";

export const MemberPage = () => {
    const router = useRouter();
    const { data: member, isLoading, isError } = useMemberByAccountName(
        router.query.id as string
    );

    if (isLoading) {
        return (
            <MemberPageContainer pageTitle="Loading member details...">
                <LoadingContainer />
            </MemberPageContainer>
        );
    }

    if (isError || !member) {
        return (
            <MemberPageContainer pageTitle="Error">
                <MessageContainer
                    title="Error loading member information"
                    message="Please reload the page to try again."
                />
            </MemberPageContainer>
        );
    }

    return (
        <MemberPageContainer pageTitle={`${member.name}'s Profile`}>
            <DelegateFundsAvailable account={member.account} />
            <Container className="flex justify-center">
                <MemberHoloCard member={member} className="max-w-xl" />
            </Container>
            <MemberCard member={member} showBalance />
            {/* TODO: Show member collections once we have templateId on MemberAccountData */}
            <MemberCollections member={member as MemberData} />
        </MemberPageContainer>
    );
};

export default MemberPage;

interface ContainerProps {
    pageTitle: string;
    children: React.ReactNode;
}

const MemberPageContainer = ({ pageTitle, children }: ContainerProps) => (
    <SideNavLayout title={pageTitle} className="divide-y">
        <Container>
            <Heading size={1}>Member Profile</Heading>
        </Container>
        {children}
    </SideNavLayout>
);
