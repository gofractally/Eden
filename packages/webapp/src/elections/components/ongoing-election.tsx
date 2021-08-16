import dayjs from "dayjs";

import { useCommunityGlobals, useMemberStats } from "_app";
import { Container, Heading, Loader, Text } from "_app/ui";
import { ErrorLoadingElection } from "elections";
import { ElectionStatus } from "elections/interfaces";

import * as Ongoing from "./ongoing-election-components";

// TODO: Make sure time zone changes during election are handled properly
export const OngoingElection = ({ election }: { election: any }) => {
    const {
        data: globals,
        isLoading: isLoadingGlobals,
        isError: isErrorGlobals,
    } = useCommunityGlobals();
    const {
        data: memberStats,
        isLoading: isLoadingMemberStats,
        isError: isErrorMemberStats,
    } = useMemberStats();

    const isLoading = isLoadingGlobals || isLoadingMemberStats;
    if (isLoading) {
        return (
            <Container>
                <Loader />
            </Container>
        );
    }

    const isError = isErrorGlobals || isErrorMemberStats;
    if (isError || !memberStats) {
        return <ErrorLoadingElection />;
    }

    const { election_round_time_sec, election_break_time_sec } = globals;
    const roundDurationSec = election_round_time_sec + election_break_time_sec;
    const roundDurationMs = roundDurationSec * 1000;
    const roundIndex = election.round ?? memberStats.ranks.length;
    const roundEndTimeRaw = election.round_end ?? election.seed.end_time;
    const roundEndTime = dayjs(roundEndTimeRaw + "Z");
    const roundStartTime = dayjs(roundEndTime).subtract(roundDurationMs);

    return (
        <div className="divide-y">
            <Container darkBg>
                <Heading size={2}>Today's Election</Heading>
                <Text>In progress until 6:30pm EDT</Text>
            </Container>
            <Ongoing.SupportSegment />
            {/* TODO: How do we get previous round info for rounds that didn't come to consensus? Do that here. */}
            {roundIndex > 0 &&
                [...Array(roundIndex)].map((_, i) => (
                    <Ongoing.CompletedRoundSegment
                        key={`election-round-${i + 1}`}
                        roundIndex={i}
                    />
                ))}
            {election?.electionState === ElectionStatus.Final ? (
                <Ongoing.ChiefsRoundSegment roundEndTime={roundEndTime} />
            ) : (
                <Ongoing.OngoingRoundSegment
                    electionState={election.electionState}
                    roundIndex={roundIndex}
                    roundStartTime={roundStartTime}
                    roundEndTime={roundEndTime}
                    roundDurationMs={roundDurationMs}
                    electionConfig={election.config}
                />
            )}
        </div>
    );
};

export default OngoingElection;
