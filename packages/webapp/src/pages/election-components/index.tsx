import React, { useState } from "react";
import { GetServerSideProps } from "next";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";
import { FaRegSquare, FaSquare } from "react-icons/fa";

import {
    Container,
    FluidLayout,
    Heading,
    queryMembersStats,
    queryMembers,
} from "_app";
import { MemberChip, MembersGrid } from "members";
import { MemberData } from "members/interfaces";

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

    const handleMemberClick = (e: React.MouseEvent, member: MemberData) => {
        setSelected(member.account);
    };

    return (
        <FluidLayout title="Community">
            <Container>
                <Heading size={1}>Group 1</Heading>
                {members.isLoading && "Loading members..."}
                {members.error && "Fail to load members"}
            </Container>
            <MembersGrid members={members.data}>
                {(member) => (
                    <MemberChip
                        key={member.account}
                        member={member}
                        onClickChip={(e) => handleMemberClick(e, member)}
                        onClickProfileImage={(e) =>
                            handleMemberClick(e, member)
                        }
                    >
                        {selectedMember === member.account ? (
                            <FaSquare
                                size={31}
                                className="text-gray-600 hover:text-gray-700"
                            />
                        ) : (
                            <FaRegSquare
                                size={31}
                                className="text-gray-300 hover:text-gray-400"
                            />
                        )}
                    </MemberChip>
                )}
            </MembersGrid>
        </FluidLayout>
    );
};

export default MembersPage;
