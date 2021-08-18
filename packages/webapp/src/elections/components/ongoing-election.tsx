import dayjs, { Dayjs } from "dayjs";
import { BsInfoCircle } from "react-icons/bs";

import {
    useUALAccount,
    useCommunityGlobals,
    useCurrentMember,
    useMemberStats,
    useOngoingElectionData,
} from "_app";
import { Button, Container, Heading, Loader, Link, Text } from "_app/ui";
import { ErrorLoadingElection } from "elections";
import {
    ActiveStateConfigType,
    Election,
    ElectionStatus,
} from "elections/interfaces";

import * as Ongoing from "./ongoing-election-components";

// TODO: How do we get previous round info for rounds that didn't come to consensus? Do that here.
// TODO: Non-participating-eden-member currently sees error.
// TODO: Specifically, what happens to CompletedRound component when non-participating-eden-member logs in?
// TODO: Make sure time zone changes during election are handled properly
export const OngoingElection = ({ election }: { election: any }) => {
    const { data: loggedInUser } = useCurrentMember();
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
    const { data: ongoingElectionData } = useOngoingElectionData();

    console.info(
        "<OngoingElection /> ongoingElectiondata:",
        ongoingElectionData
    );

    if (isLoadingGlobals || isLoadingMemberStats) {
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

    // TODO: Model all this data to be self-consistent and to abstract the frontend from the complexities of the backend logic
    // start with logged-in user
    // check that they registered for the election (and cast at least one vote?)
    // see if they're still participating
    // Below in the UI, iterate through myDelegation *only* up to the level of currentElection.round (to avoid old member data)

    const roundDurationSec = globals.election_round_time_sec;
    const roundDurationMs = roundDurationSec * 1000;
    const roundIndex = election.round ?? memberStats.ranks.length;
    const roundEndTimeRaw = election.round_end ?? election.seed.end_time;
    const roundEndTime = dayjs(roundEndTimeRaw + "Z");
    const roundStartTime = dayjs(roundEndTime).subtract(roundDurationMs);

    console.info("ongoingElectionData:", ongoingElectionData);

    return (
        <div className="divide-y">
            <Container darkBg>
                <Heading size={2}>Today's Election</Heading>
                <Text>In progress until 6:30pm EDT</Text>
            </Container>
            <Ongoing.SupportSegment />

            <CompletedRounds
                numCompletedRounds={
                    ongoingElectionData?.completedRounds?.length
                }
            />
            <SignInContainer />
            <SignUpContainer />
            <NoParticipationInFurtherRoundsMessage
                ongoingElectionData={ongoingElectionData}
            />
            <CurrentRound
                ongoingElectionData={ongoingElectionData}
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

interface NoFurtherParticipationProps {
    ongoingElectionData?: Election;
}

const NoParticipationInFurtherRoundsMessage = ({
    ongoingElectionData,
}: NoFurtherParticipationProps) => {
    if (!ongoingElectionData) return null;
    if (ongoingElectionData.isMemberStillParticipating) {
        return null;
    }
    return (
        <Container className="flex items-center space-x-2 pr-8 py-8">
            <BsInfoCircle
                size={22}
                className="ml-px text-gray-400 place-self-start mt-1"
            />
            <div className="flex-1">
                <Text size="sm">
                    You aren't involved in further rounds. Please{" "}
                    <Link href={""}>join the Community Room</Link> &amp; Support
                    for news and updates of the ongoing election. The results
                    will be displayed in the My Delegation area after the
                    election is complete. Once the Chief Delegates are selected,
                    they are displayed below.
                </Text>
            </div>
        </Container>
    );
};

export default OngoingElection;

interface CompletedRoundsProps {
    numCompletedRounds?: number;
}

const CompletedRounds = ({ numCompletedRounds }: CompletedRoundsProps) => {
    const { data: currentMember } = useCurrentMember();
    if (!currentMember || !numCompletedRounds) return null;
    return (
        <>
            {[...Array(numCompletedRounds)].map((_, i) => {
                return (
                    <Ongoing.CompletedRoundSegment
                        key={`election-round-${i + 1}`}
                        roundIndex={i}
                    />
                );
            })}
        </>
    );
};

export interface CurrentRoundProps {
    ongoingElectionData?: Election;
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
            ongoingElectionData={props.ongoingElectionData}
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
