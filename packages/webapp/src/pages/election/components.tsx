import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import { FluidLayout, queryMembersStats, queryMembers } from "_app";
import { Container, Heading } from "_app/ui";
import { MembersGrid } from "members";
import { VotingMemberChip, DelegateChip } from "elections";

const MEMBERS_PAGE_SIZE = 18;

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const queryClient = new QueryClient();
    const membersPage = parseInt((query.membersPage as string) || "1");

    await Promise.all([
        queryClient.prefetchQuery(queryMembersStats),
        queryClient.prefetchQuery(queryMembers(membersPage, MEMBERS_PAGE_SIZE)),
    ]);

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
            membersPage,
        },
    };
};

interface Props {
    membersPage: number;
}

export const MembersPage = (props: Props) => {
    const [selectedMember, setSelected] = useState<string | null>(null);

    const members = useQuery({
        ...queryMembers(props.membersPage, MEMBERS_PAGE_SIZE),
        keepPreviousData: true,
    });

    return (
        <FluidLayout title="Community">
            <Container className="pt-6 border-b">
                <Heading size={1}>Voting Chips</Heading>
                {members.isLoading && "Loading members..."}
                {members.error && "Fail to load members"}
            </Container>
            <MembersGrid members={members.data}>
                {(member) => (
                    <VotingMemberChip
                        key={member.account}
                        member={member}
                        isSelected={selectedMember === member.account}
                        onSelect={() => setSelected(member.account)}
                        votesReceived={member.account === "pip.edev" ? 5 : 0}
                        votingFor="Philip Pip"
                    />
                )}
            </MembersGrid>
            <Container className="pt-6 border-t border-b">
                <Heading size={1}>Delegate Chip</Heading>
                {members.isLoading && "Loading members..."}
                {members.error && "Fail to load members"}
            </Container>
            <MembersGrid members={members.data?.slice(1, 2)}>
                {(member) => (
                    <DelegateChip
                        key={member.account}
                        member={member}
                        level="D3 - Chief Delegate"
                    />
                )}
            </MembersGrid>
        </FluidLayout>
    );
};

export default MembersPage;
