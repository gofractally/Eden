import { GetServerSideProps } from "next";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import {
    CallToAction,
    Card,
    Heading,
    Link,
    queryMembersStats,
    queryTreasuryStats,
    RawLayout,
    Text,
    Asset,
    assetToString,
} from "_app";

export const getServerSideProps: GetServerSideProps = async () => {
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery(queryMembersStats);
    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
    };
};

export const Index = () => {
    const { data: memberStats } = useQuery({
        ...queryMembersStats,
        keepPreviousData: true,
    });

    const { data: treasuryBalance } = useQuery({
        ...queryTreasuryStats,
        keepPreviousData: true,
    });

    return (
        <RawLayout>
            <CallToAction
                href="http://eden.eoscommunity.org"
                buttonLabel="Learn more"
                target="_blank"
                isExternal
            >
                Eden is a community working to maximize the power and
                independence of its members, thereby securing life, liberty,
                property, and justice for all.
            </CallToAction>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-5 text-gray-800">
                <div className="col-span-1 lg:col-span-2 space-y-4">
                    <Card>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-16 lg:px-8 text-gray-800">
                            <div className="col-span-2 md:col-span-1 space-y-4">
                                <Heading size={2}>Welcome to Eden</Heading>
                                <Text>
                                    A team of people can be more powerful than
                                    the sum of its members, but all teams need a
                                    means to reach consensus, or they will fall
                                    apart. Unfortunately, traditional democratic
                                    processes end up empowering politicians and
                                    disempowering the people who participate.
                                </Text>
                            </div>
                            <div className="col-span-2 md:col-span-1 space-y-4">
                                <Text>
                                    EdenOS is a revolutionary new democratic
                                    process that protects and enhances the
                                    independence and power of those who join.
                                    When you join the Eden community, you gain
                                    access to a group of people working together
                                    to empower you and your family to make a
                                    bigger impact in the world.
                                </Text>
                                <Text>
                                    To learn more about Eden and how you can get
                                    involved, visit{" "}
                                    <Link
                                        href="http://eden.eoscommunity.org"
                                        target="_blank"
                                        isExternal
                                    >
                                        eden.eoscommunity.org
                                    </Link>
                                    .
                                </Text>
                            </div>
                        </div>
                    </Card>
                </div>
                <aside className="col-span-1 space-y-4 pb-5">
                    {treasuryBalance && (
                        <CommunityStatsCard
                            memberStats={memberStats}
                            treasuryBalance={treasuryBalance}
                        />
                    )}
                </aside>
            </div>
        </RawLayout>
    );
};

interface CommunityStatsProps {
    memberStats: any;
    treasuryBalance: Asset;
}

const CommunityStatsCard = ({
    memberStats,
    treasuryBalance,
}: CommunityStatsProps) =>
    memberStats && (
        <Card className="flex flex-col justify-center items-center h-full space-y-4 text-md lg:text-lg">
            <Heading size={2} className="mb-2">
                Community Stats
            </Heading>
            <Text className="font-medium" size="md">
                Treasury: {assetToString(treasuryBalance, 4)}
            </Text>
            <Link href="/members" className="font-medium">
                {memberStats.active_members} active member
                {memberStats.active_members !== 1 && "s"}
            </Link>
            <Link href="/induction/pending-invitations" className="font-medium">
                {memberStats.pending_members} pending invitation
                {memberStats.pending_members !== 1 && "s"}
            </Link>
        </Card>
    );

export default Index;
