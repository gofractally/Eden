import { GetServerSideProps } from "next";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import {
    CallToAction,
    Card,
    Heading,
    Link,
    membersStatsQuery,
    RawLayout,
    Text,
} from "_app";

export const getServerSideProps: GetServerSideProps = async () => {
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery(membersStatsQuery);
    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
    };
};

export const Index = () => {
    const { data: memberStats } = useQuery({
        ...membersStatsQuery,
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
            <Card>
                <div className="grid grid-cols-2 gap-4 md:gap-16 lg:gap-24 lg:px-24 xl:px-56 text-gray-800">
                    <div className="col-span-2 md:col-span-1 space-y-4">
                        <Heading size={2}>Welcome to Eden</Heading>
                        <Text>
                            A team of people can be more powerful than the sum
                            of its members, but all teams need a means to reach
                            consensus, or they will fall apart. Unfortunately,
                            traditional democratic processes end up empowering
                            politicians and disempowering the people who
                            participate.
                        </Text>
                        {memberStats && (
                            <Text>
                                The community has{" "}
                                <strong>
                                    {memberStats.active_members} active member
                                    {memberStats.active_members !== 1 && "s"}
                                </strong>{" "}
                                and{" "}
                                <strong>
                                    {memberStats.pending_members} pending
                                    invitation
                                    {memberStats.pending_members !== 1 && "s"}
                                </strong>
                                .
                            </Text>
                        )}
                    </div>
                    <div className="col-span-2 md:col-span-1 space-y-4">
                        <Text>
                            EdenOS is a revolutionary new democratic process
                            that protects and enhances the independence and
                            power of those who join. When you join the Eden
                            community, you gain access to a group of people
                            working together to empower you and your family to
                            make a bigger impact in the world.
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
        </RawLayout>
    );
};

export default Index;
