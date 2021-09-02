import { ParticipationCard } from "elections/components/registration-election-components";
import { ElectionStatus } from "elections/interfaces";
import { GetServerSideProps } from "next";
import { QueryClient, useQuery, UseQueryResult } from "react-query";
import { dehydrate } from "react-query/hydration";

import {
    Asset,
    assetToString,
    ElectionParticipationStatus,
    queryMembersStats,
    queryTreasuryStats,
    SideNavLayout,
    useCurrentElection,
    useCurrentMember,
} from "_app";
import {
    CallToAction,
    Card,
    Container,
    Heading,
    Link,
    LoadingCard,
    Text,
} from "_app/ui";
import { ROUTES } from "_app/config";
import { MemberStats } from "members";
import { EncryptionPasswordAlert } from "encryption";

export const getServerSideProps: GetServerSideProps = async () => {
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery(queryMembersStats);
    await queryClient.prefetchQuery(queryTreasuryStats);
    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
    };
};

export const Index = () => {
    const memberStats = useQuery({
        ...queryMembersStats,
        keepPreviousData: true,
    });

    const treasuryStats = useQuery({
        ...queryTreasuryStats,
        keepPreviousData: true,
    });

    const { data: currentMember } = useCurrentMember();
    const { data: currentElection } = useCurrentElection();

    const renderBanner =
        currentElection?.electionState !== ElectionStatus.Registration ||
        currentMember?.election_participation_status ===
            ElectionParticipationStatus.InElection;

    return (
        <SideNavLayout
            banner={
                renderBanner && (
                    <EncryptionPasswordAlert
                        promptSetupEncryptionKey={
                            currentElection?.electionState !==
                            ElectionStatus.Registration
                        }
                    />
                )
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y">
                <Container>
                    <Heading size={1}>Home</Heading>
                </Container>
                <Container className="col-span-1 lg:col-span-2">
                    <ElectionCard />
                </Container>
                <Container className="col-span-1 lg:col-span-2">
                    <CallToAction
                        href="http://eden.eoscommunity.org"
                        buttonLabel="Learn more"
                        target="_blank"
                        isExternal
                    >
                        Eden is a community working to maximize the power and
                        independence of its members, thereby securing life,
                        liberty, property, and justice for all.
                    </CallToAction>
                </Container>
                <Card className="col-span-1 hidden lg:block">
                    <WelcomeText1 />
                </Card>
                <Card className="col-span-1 hidden lg:block">
                    <WelcomeText2 />
                </Card>
                <Card className="col-span-1 lg:hidden space-y-4">
                    <WelcomeText1 />
                    <WelcomeText2 />
                </Card>
                <div className="col-span-1 lg:col-span-2 border-t">
                    <CommunityStats
                        memberStats={memberStats}
                        treasuryStats={treasuryStats}
                    />
                </div>
            </div>
        </SideNavLayout>
    );
};

const ElectionCard = () => {
    const { data: currentElection, isLoading, isError } = useCurrentElection();

    if (isError)
        return (
            <Card className="flex items-center justify-center">
                <Heading size={2}>Error loading election</Heading>
            </Card>
        );

    if (isLoading) {
        return <LoadingCard />;
    }

    switch (currentElection?.electionState) {
        case ElectionStatus.Registration:
        case ElectionStatus.Seeding:
        case ElectionStatus.InitVoters:
            return <ParticipationCard election={currentElection} />;
        case ElectionStatus.Active:
        case ElectionStatus.PostRound:
        case ElectionStatus.Final:
            return (
                <>
                    <Heading size={2}>Election in progress</Heading>
                    <Text>
                        Visit the{" "}
                        <Link href={ROUTES.ELECTION.href}>Election page</Link>{" "}
                        for more details.
                    </Text>
                </>
            );
        default:
            return <LoadingCard />;
    }
};
const WelcomeText1 = () => (
    <>
        <Heading size={2}>Welcome to Eden</Heading>
        <Text>
            A team of people can be more powerful than the sum of its members,
            but all teams need a means to reach consensus, or they will fall
            apart. Unfortunately, traditional democratic processes end up
            empowering politicians and disempowering the people who participate.
        </Text>
    </>
);
const WelcomeText2 = () => (
    <>
        <Text>
            EdenOS is a revolutionary new democratic process that protects and
            enhances the independence and power of those who join. When you join
            the Eden community, you gain access to a group of people working
            together to empower you and your family to make a bigger impact in
            the world.
        </Text>
        <Text>
            To learn more about Eden and how you can get involved, visit{" "}
            <Link
                href="http://eden.eoscommunity.org"
                target="_blank"
                isExternal
            >
                eden.eoscommunity.org
            </Link>
            .
        </Text>
    </>
);

interface CommunityStatsProps {
    memberStats: UseQueryResult<MemberStats | undefined>;
    treasuryStats: UseQueryResult<Asset | undefined>;
}

const CommunityStats = ({
    memberStats: memberInfo,
    treasuryStats,
}: CommunityStatsProps) => {
    const { data: memberStats, isLoading: isLoadingMemberStats } = memberInfo;
    const {
        data: treasuryBalance,
        isLoading: isLoadingTreasuryBalance,
    } = treasuryStats;

    if (isLoadingMemberStats || isLoadingTreasuryBalance) {
        return <LoadingCard />;
    }

    if (!memberStats && !treasuryBalance) return null;

    return (
        <Card className="flex flex-col justify-center items-center space-y-1 lg:text-lg my-4">
            <Heading size={2} className="mb-2">
                Community Stats
            </Heading>
            {treasuryBalance && (
                <Text className="font-medium" size="inherit">
                    Treasury: {assetToString(treasuryBalance, 4)}
                </Text>
            )}
            {memberStats && (
                <>
                    <Link href={ROUTES.MEMBERS.href} className="font-medium">
                        {memberStats.active_members} active member
                        {memberStats.active_members !== 1 && "s"}
                    </Link>
                    <Link
                        href={`${ROUTES.INDUCTION.href}/pending-invitations`}
                        className="font-medium"
                    >
                        {memberStats.pending_members} pending invitation
                        {memberStats.pending_members !== 1 && "s"}
                    </Link>
                </>
            )}
        </Card>
    );
};

export default Index;
