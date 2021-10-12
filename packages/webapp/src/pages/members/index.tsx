import { useState } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import {
    Container,
    SideNavLayout,
    Heading,
    PaginationNav,
    queryNewMembers,
    usePagedMembers,
} from "_app";
import { MemberChip, MemberData, MembersGrid } from "members";

const MEMBERS_PAGE_SIZE = 18;
const NEW_MEMBERS_PAGE_SIZE = 12;

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const queryClient = new QueryClient();

    const newMembersPage = parseInt((query.newMembersPage as string) || "1");

    await Promise.all([
        queryClient.prefetchQuery(
            queryNewMembers(newMembersPage, NEW_MEMBERS_PAGE_SIZE)
        ),
    ]);

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
            newMembersPage,
        },
    };
};

interface Props {
    membersPage: number;
    newMembersPage: number;
}

export const MembersPage = (props: Props) => {
    const router = useRouter();
    const [newMembersPage, setNewMembersPage] = useState(props.newMembersPage);

    const newMembers = useQuery({
        ...queryNewMembers(newMembersPage, NEW_MEMBERS_PAGE_SIZE),
        keepPreviousData: true,
    });

    const paginateNewMembers = (increment: number) => {
        setNewMembersPage(newMembersPage + increment);
        router.push(
            {
                query: { newMembersPage: newMembersPage + increment },
            },
            undefined,
            { scroll: false }
        );
    };

    const queriedMembers = usePagedMembers(MEMBERS_PAGE_SIZE);

    return (
        <SideNavLayout title="Community">
            <Container>
                <Heading size={1}>Community</Heading>
            </Container>
            <Container>
                <Heading size={2}>New members</Heading>
                {newMembers.isLoading && "Loading new members..."}
                {newMembers.error && "Fail to load new members"}
            </Container>
            {newMembers.data && (
                <>
                    <div className="border-t border-b">
                        <MembersGrid
                            members={newMembers.data}
                            dataTestId="new-members-grid"
                        >
                            {(member) => (
                                <MemberChip
                                    key={`new-members-${member.account}`}
                                    member={member}
                                />
                            )}
                        </MembersGrid>
                    </div>
                    <Container>
                        <PaginationNav
                            paginate={paginateNewMembers}
                            hasNext={
                                newMembers.data.length >= NEW_MEMBERS_PAGE_SIZE
                            }
                            hasPrevious={newMembersPage > 1}
                        />
                    </Container>
                </>
            )}
            <Container>
                <Heading size={2}>All members</Heading>
                {queriedMembers.result.isLoading && "Loading members..."}
                {queriedMembers.result.isError && "Fail to load members"}
            </Container>
            {queriedMembers.result.data && (
                <>
                    <div className="border-t border-b">
                        <MembersGrid
                            members={queriedMembers.result.data as MemberData[]}
                            dataTestId="members-grid"
                        >
                            {(member) => (
                                <MemberChip
                                    key={`all-members-${member.account}`}
                                    member={member}
                                />
                            )}
                        </MembersGrid>
                    </div>
                    <Container>
                        <PaginationNav
                            hasNext={queriedMembers.hasNextPage}
                            hasPrevious={queriedMembers.hasPreviousPage}
                            goToNextPage={queriedMembers.next}
                            goToPrevPage={queriedMembers.previous}
                        />
                    </Container>
                </>
            )}
        </SideNavLayout>
    );
};

export default MembersPage;
