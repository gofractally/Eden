import { GetServerSideProps } from "next";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import { CallToAction, Card, RawLayout, SingleColLayout } from "_app";
import {
    getMember,
    MemberCard,
    MemberCollections,
    MemberHoloCard,
} from "members";

const QUERY_MEMBER_DATA = "query_member_data";

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    const account = params!.id as string;

    const queryClient = new QueryClient();
    await queryClient.prefetchQuery([QUERY_MEMBER_DATA, account], () =>
        getMember(account)
    );

    return { props: { account, dehydratedState: dehydrate(queryClient) } };
};

interface Props {
    account: string;
}

export const MemberPage = ({ account }: Props) => {
    const { data: member, isLoading } = useQuery(
        [QUERY_MEMBER_DATA, account],
        () => getMember(account)
    );

    if (member) {
        return (
            <RawLayout title={`${member.name}'s Profile`}>
                <Card>
                    <div className="flex items-center space-y-10 xl:space-y-0 xl:space-x-20 flex-col xl:flex-row">
                        <div className="max-w-2xl">
                            <MemberHoloCard member={member} />
                        </div>
                        <MemberCard member={member} />
                    </div>
                </Card>
                <MemberCollections
                    account={member.account}
                    templateId={member.templateId}
                />
            </RawLayout>
        );
    }

    if (isLoading) {
        return <RawLayout>Loading profile...</RawLayout>;
    }

    return (
        <SingleColLayout title="Member not found">
            <CallToAction href="/members" buttonLabel="Browse members">
                This account is not an active Eden member.
            </CallToAction>
        </SingleColLayout>
    );
};

export default MemberPage;
