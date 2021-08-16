import dayjs, { Dayjs } from "dayjs";

import {
    useCommunityGlobals,
    useCurrentMember,
    useMemberStats,
    useUALAccount,
} from "_app";
import { Button, Container, Heading, Loader, Text } from "_app/ui";
import { ErrorLoadingElection } from "elections";
import { ActiveStateConfigType, ElectionStatus } from "elections/interfaces";

import * as Ongoing from "./ongoing-election-components";

// TODO: How do we get previous round info for rounds that didn't come to consensus? Do that here.
// TODO: Non-participating-eden-member currently sees error.
// TODO: Specifically, what happens to CompletedRound component when non-participating-eden-member logs in?
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
            <CompletedRounds roundIndex={roundIndex} />
            <SignInContainer />
            <SignUpContainer />
            <CurrentRound
                electionState={election.electionState}
                roundIndex={roundIndex}
                roundStartTime={roundStartTime}
                roundEndTime={roundEndTime}
                roundDurationMs={roundDurationMs}
                electionConfig={election.config}
            />
        </div>
    );
};

export default OngoingElection;

interface CompletedRoundsProps {
    roundIndex: number;
}

const CompletedRounds = ({ roundIndex }: CompletedRoundsProps) => {
    const { data: currentMember } = useCurrentMember();
    if (!currentMember) return null;
    return (
        <>
            {[...Array(roundIndex)].map((_, i) => (
                <Ongoing.CompletedRoundSegment
                    key={`election-round-${i + 1}`}
                    roundIndex={i}
                />
            ))}
        </>
    );
};

export interface CurrentRoundProps {
    electionState: string;
    roundIndex: number;
    roundStartTime: Dayjs;
    roundEndTime: Dayjs;
    roundDurationMs: number;
    electionConfig?: ActiveStateConfigType;
}

const CurrentRound = (props: CurrentRoundProps) => {
    const { data: currentMember } = useCurrentMember();

    if (props.electionState === ElectionStatus.Final) {
        return <Ongoing.ChiefsRoundSegment roundEndTime={props.roundEndTime} />;
    }

    if (!currentMember) return null;

    return (
        <Ongoing.OngoingRoundSegment
            electionState={props.electionState}
            roundIndex={props.roundIndex}
            roundStartTime={props.roundStartTime}
            roundEndTime={props.roundEndTime}
            roundDurationMs={props.roundDurationMs}
            electionConfig={props.electionConfig}
        />
    );
};

export const SignInContainer = () => {
    const [ualAccount, _, ualShowModal] = useUALAccount();
    if (ualAccount) return null;
    return (
        <Container className="flex flex-col justify-center items-center py-16">
            <Button onClick={ualShowModal} size="sm">
                Sign in to continue
            </Button>
        </Container>
    );
};

export const SignUpContainer = () => {
    const [ualAccount] = useUALAccount();
    const { data: currentMember } = useCurrentMember();
    if (!ualAccount || Boolean(currentMember)) return null;
    return (
        <Container className="flex flex-col justify-center items-center py-16">
            <Button href="/induction" size="sm">
                Join Eden
            </Button>
        </Container>
    );
};
