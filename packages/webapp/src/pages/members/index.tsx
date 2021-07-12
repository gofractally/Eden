import { useState } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import {
    FluidLayout,
    Heading,
    PaginationNav,
    queryMembersStats,
    queryMembers,
    queryNewMembers,
} from "_app";
import { MembersGrid } from "members";

const MEMBERS_PAGE_SIZE = 18;
const NEW_MEMBERS_PAGE_SIZE = 12;

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const queryClient = new QueryClient();

    const membersPage = parseInt((query.membersPage as string) || "1");
    const newMembersPage = parseInt((query.newMembersPage as string) || "1");

    await Promise.all([
        queryClient.prefetchQuery(queryMembersStats),
        queryClient.prefetchQuery(queryMembers(membersPage, MEMBERS_PAGE_SIZE)),
        queryClient.prefetchQuery(
            queryNewMembers(newMembersPage, NEW_MEMBERS_PAGE_SIZE)
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

    const { data: memberStats } = useQuery({
        ...queryMembersStats,
        keepPreviousData: true,
    });
    const totalMembersPages =
        memberStats &&
        Math.ceil(memberStats.active_members / MEMBERS_PAGE_SIZE);

    const members = useQuery({
        ...queryMembers(membersPage, MEMBERS_PAGE_SIZE),
        keepPreviousData: true,
    });

    const newMembers = useQuery({
        ...queryNewMembers(newMembersPage, NEW_MEMBERS_PAGE_SIZE),
        keepPreviousData: true,
    });

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
        <FluidLayout title="Community">
            <div className="p-2.5">
                <Heading size={1}>New Members</Heading>
                {newMembers.isLoading && "Loading new members..."}
                {newMembers.error && "Fail to load new members"}
            </div>
            {newMembers.data && (
                <>
                    <div className="border-t border-b">
                        <MembersGrid
                            members={newMembers.data}
                            dataTestId="new-members-grid"
                        />
                    </div>
                    <div className="p-2.5">
                        <PaginationNav
                            paginate={paginateNewMembers}
                            hasNext={
                                newMembers.data.length >= NEW_MEMBERS_PAGE_SIZE
                            }
                            hasPrevious={newMembersPage > 1}
                        />
                    </div>
                </>
            )}
            <div className="p-2.5">
                <Heading size={1}>All Members</Heading>
                {members.isLoading && "Loading members..."}
                {members.error && "Fail to load members"}
            </div>
            {members.data && (
                <>
                    <div className="border-t border-b">
                        <MembersGrid
                            members={members.data}
                            dataTestId="members-grid"
                        />
                    </div>
                    <div className="p-2.5">
                        <PaginationNav
                            paginate={paginateMembers}
                            hasNext={members.data.length >= MEMBERS_PAGE_SIZE}
                            hasPrevious={membersPage > 1}
                            pageNumber={membersPage}
                            totalPages={totalMembersPages}
                        />
                    </div>
                </>
            )}
        </FluidLayout>
    );
};

export default MembersPage;
