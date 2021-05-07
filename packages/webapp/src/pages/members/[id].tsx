import { GetServerSideProps } from "next";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import { CallToAction, Card, RawLayout, SingleColLayout } from "_app";
import {
    getMember,
    MemberCard,
    MemberCollections,
    MemberData,
    MemberHoloCard,
} from "members";

const QUERY_MEMBER_DATA = "query_member_data";

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    try {
        if (!params || !params.id || Array.isArray(params.id)) {
            throw new Error("member id is a required string parameter");
        }

        const account = params.id;

        const queryClient = new QueryClient();
        queryClient.prefetchQuery([QUERY_MEMBER_DATA, account], () =>
            getMember(account)
        );

        return { props: { account, dehydratedState: dehydrate(queryClient) } };
    } catch (error) {
        console.error(">>> Fail to list eden members:" + error);
        return { props: { error: "Fail to list eden members" } };
    }
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
                    <div className="flex justify-center items-center space-y-10 xl:space-y-0 xl:space-x-10 flex-col xl:flex-row">
                        <div className="max-w-xl">
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
