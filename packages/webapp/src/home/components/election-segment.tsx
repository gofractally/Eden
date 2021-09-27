import { useCurrentElection, useIsCommunityActive } from "_app";
import { ROUTES } from "_app/routes";
import { Container, Heading, Link, Loader, Text } from "_app/ui";

import { ElectionStatus } from "elections/interfaces";
import { ParticipationCard } from "elections/components/registration-election-components";
import { ErrorLoadingElection } from "elections";

interface Props {
    className?: string;
}

export const ElectionSegment = ({ className = "" }: Props) => {
    const { data: isActiveCommunity } = useIsCommunityActive();

    return isActiveCommunity ? (
        <div className={className}>
            <ElectionSegmentContents />
        </div>
    ) : null;
};

export default ElectionSegment;

const ElectionSegmentContents = () => {
    const { data: currentElection, isLoading, isError } = useCurrentElection();
    if (isError) return <ErrorLoadingElection />;

    if (isLoading) {
        return <LoaderContainer />;
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
                <Container className="text-center space-y-2">
                    <Heading size={2}>Election in progress</Heading>
                    <Text>
                        Visit the{" "}
                        <Link href={ROUTES.ELECTION.href}>Election page</Link>{" "}
                        for more details.
                    </Text>
                </Container>
            );
        default:
            return <LoaderContainer />;
    }
};

const LoaderContainer = () => (
    <div className="h-full py-12">
        <Loader />
    </div>
);
