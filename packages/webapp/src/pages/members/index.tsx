import { GetServerSideProps } from "next";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import { getMembers, MembersGrid, getNewMembers } from "members";
import { SingleColLayout, Card } from "_app";

const QUERY_MEMBERS = "query_members";
const QUERY_NEW_MEMBERS = "query_new_members";

export const getServerSideProps: GetServerSideProps = async () => {
    const queryClient = new QueryClient();

    await Promise.all([
        queryClient.prefetchQuery(QUERY_MEMBERS, () => getMembers()),
        queryClient.prefetchQuery(QUERY_NEW_MEMBERS, getNewMembers),
    ]);

    return { props: { dehydratedState: dehydrate(queryClient) } };
};

export const MembersPage = () => {
    const members = useQuery(QUERY_MEMBERS, () => getMembers());
    const newMembers = useQuery(QUERY_NEW_MEMBERS, getNewMembers);

    return (
        <SingleColLayout>
            <>
                <Card title="New Members" titleSize={2}>
                    {newMembers.isLoading && "Loading new members..."}
                    {newMembers.error && "Fail to load new members"}
                    {newMembers.data && (
                        <MembersGrid
                            members={newMembers.data}
                            dataTestId="new-members-grid"
                        />
                    )}
                </Card>
                <Card title="All Members" titleSize={2}>
                    {members.isLoading && "Loading members..."}
                    {members.error && "Fail to load members"}
                    {members.data && (
                        <MembersGrid
                            members={members.data}
                            dataTestId="members-grid"
                        />
                    )}
                </Card>
            </>
        </SingleColLayout>
    );
};

export default MembersPage;
