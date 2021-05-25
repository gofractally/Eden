import { useState } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import { getMembers, MembersGrid, getNewMembers } from "members";
import { SingleColLayout, Card, PaginationNav } from "_app";

const QUERY_MEMBERS = "query_members";
const MEMBERS_PAGE_SIZE = 16;
const QUERY_NEW_MEMBERS = "query_new_members";
const NEW_MEMBERS_PAGE_SIZE = 8;

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const queryClient = new QueryClient();

    const membersPage = parseInt((query.membersPage as string) || "1");
    const newMembersPage = parseInt((query.newMembersPage as string) || "1");

    await Promise.all([
        queryClient.prefetchQuery([QUERY_MEMBERS, membersPage], () =>
            getMembers(membersPage, MEMBERS_PAGE_SIZE)
        ),
        queryClient.prefetchQuery([QUERY_NEW_MEMBERS, newMembersPage], () =>
            getNewMembers(newMembersPage, NEW_MEMBERS_PAGE_SIZE)
        ),
    ]);

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
            membersPage,
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
    const [membersPage, setMembersPage] = useState(props.membersPage);
    const [newMembersPage, setNewMembersPage] = useState(props.newMembersPage);

    const members = useQuery(
        [QUERY_MEMBERS, membersPage],
        () => getMembers(membersPage, MEMBERS_PAGE_SIZE),
        { keepPreviousData: true }
    );

    const newMembers = useQuery(
        [QUERY_NEW_MEMBERS, newMembersPage],
        () => getNewMembers(newMembersPage, NEW_MEMBERS_PAGE_SIZE),
        { keepPreviousData: true }
    );

    const paginateMembers = (increment: number) => {
        setMembersPage(membersPage + increment);
        router.push(
            {
                query: { membersPage: membersPage + increment },
            },
            undefined,
            { scroll: false }
        );
    };

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

    return (
        <SingleColLayout>
            <>
                <Card title="New Members" titleSize={2}>
                    {newMembers.isLoading && "Loading new members..."}
                    {newMembers.error && "Fail to load new members"}
                    {newMembers.data && (
                        <>
                            <MembersGrid
                                members={newMembers.data}
                                dataTestId="new-members-grid"
                            />
                            <PaginationNav
                                paginate={paginateNewMembers}
                                hasNext={
                                    newMembers.data.length >=
                                    NEW_MEMBERS_PAGE_SIZE
                                }
                                hasPrevious={newMembersPage > 1}
                            />
                        </>
                    )}
                </Card>
                <Card title="All Members" titleSize={2}>
                    {members.isLoading && "Loading members..."}
                    {members.error && "Fail to load members"}
                    {members.data && (
                        <>
                            <MembersGrid
                                members={members.data}
                                dataTestId="members-grid"
                            />
                            <PaginationNav
                                paginate={paginateMembers}
                                hasNext={
                                    members.data.length >= MEMBERS_PAGE_SIZE
                                }
                                hasPrevious={membersPage > 1}
                            />
                        </>
                    )}
                </Card>
            </>
        </SingleColLayout>
    );
};

export default MembersPage;
