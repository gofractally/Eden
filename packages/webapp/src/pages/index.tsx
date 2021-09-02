import { ElectionStatus } from "elections/interfaces";
import { GetServerSideProps } from "next";
import { QueryClient } from "react-query";
import { dehydrate } from "react-query/hydration";

import {
    ElectionParticipationStatus,
    queryMembersStats,
    queryTreasuryStats,
    SideNavLayout,
    useCurrentElection,
    useCurrentMember,
} from "_app";
import { Container, Heading } from "_app/ui";
import { EncryptionPasswordAlert } from "encryption";
import {
    CommunityStats,
    ElectionSegment,
    LearnMoreCTA,
    WelcomeText,
} from "home";

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
            <div className="grid grid-cols-6 divide-y border-b">
                <Container className="col-span-6">
                    <Heading size={1}>Home</Heading>
                </Container>
                <LearnMoreCTA className="col-span-6" />
                <ElectionSegment className="col-span-6 lg:col-span-4" />
                <CommunityStats className="hidden lg:block lg:col-span-2 border-l" />
                <WelcomeText className="col-span-6" />
                <CommunityStats className="lg:hidden col-span-6 border-t" />
            </div>
        </SideNavLayout>
    );
};

export default Index;
