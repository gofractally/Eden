import { useEffect, useState } from "react";
import { RiVideoUploadLine } from "react-icons/ri";
import dayjs, { Dayjs } from "dayjs";

import {
    useCurrentMember,
    useMemberDataFromVoteData,
    useVoteData,
} from "_app/hooks/queries";
import { Button, Container, Expander, Heading, Loader, Text } from "_app/ui";
import { DelegateChip, ErrorLoadingElection } from "elections";
import { MembersGrid } from "members";

import RoundHeader from "./round-header";
import { useCountdown, useCurrentElection } from "_app";

interface RoundSegmentProps {
    roundEndTime: Dayjs;
}

export const ChiefsRoundSegment = ({ roundEndTime }: RoundSegmentProps) => {
    const [timeIsUp, setTimeIsUp] = useState(false);
    const {
        data: currentMember,
        isLoading: isLoadingCurrentMember,
        isError: isErrorCurrentMember,
    } = useCurrentMember();
    const {
        data: participantData,
        isLoading: isLoadingParticipantData,
        isError: isErrorParticipantData,
    } = useVoteData({ limit: 20 });
    const {
        data: members,
        isLoading: isLoadingMembers,
        isError: isErrorMembers,
    } = useMemberDataFromVoteData(participantData);

    useCurrentElection({
        enabled: timeIsUp,
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
    });

    useEffect(() => {
        if (dayjs().isAfter(roundEndTime)) {
            setTimeIsUp(true);
        }
    }, []);

    const isLoading =
        isLoadingCurrentMember || isLoadingParticipantData || isLoadingMembers;

    if (isLoading) {
        return (
            <Container>
                <Loader />
            </Container>
        );
    }

    const isError =
        isErrorCurrentMember ||
        isErrorParticipantData ||
        isErrorMembers ||
        !members ||
        members?.length !== participantData?.length;

    if (isError) return <ErrorLoadingElection />;

    const isUserParticipant = participantData?.some(
        (participant) => participant.member === currentMember?.account
    );

    return (
        <Expander
            header={
                <Header
                    roundEndTime={roundEndTime}
                    onEndCountdown={() => setTimeIsUp(true)}
                    timeIsUp={timeIsUp}
                />
            }
            startExpanded
            locked
        >
            <Container className="space-y-2">
                <Heading size={3}>Chief Delegates</Heading>
                <Text>
                    The new slate of Chief Delegates has officially been
                    selected! During this time, they may meet to discuss their
                    vision for the community.
                </Text>
                <Text>
                    There is, however, no voting during this round, as the Head
                    Chief is selected randomly in order to mitigate incumbent
                    advantage. That process of randomization is currently
                    underway.
                </Text>
            </Container>
            <MembersGrid members={members}>
                {(member) => (
                    <DelegateChip
                        key={`${member.account}-chief-delegate`}
                        member={member}
                        delegateTitle="Elected Chief Delegate"
                    />
                )}
            </MembersGrid>
            {isUserParticipant && (
                <Container>
                    <div className="flex flex-col xs:flex-row justify-center space-y-2 xs:space-y-0 xs:space-x-2">
                        <Button size="sm">
                            <RiVideoUploadLine size={18} className="mr-2" />
                            Upload recording
                        </Button>
                    </div>
                </Container>
            )}
        </Expander>
    );
};

export default ChiefsRoundSegment;

interface HeaderProps {
    roundEndTime: Dayjs;
    onEndCountdown: () => void;
    timeIsUp: boolean;
}

const Header = ({
    roundEndTime,
    onEndCountdown: onEnd,
    timeIsUp,
}: HeaderProps) => {
    const { hmmss } = useCountdown({ endTime: roundEndTime.toDate(), onEnd });
    return (
        <RoundHeader
            isRoundActive
            headlineComponent={
                <Text size="sm" className="font-semibold">
                    Chief Delegates elected
                </Text>
            }
            sublineComponent={
                <Text size="sm">
                    {timeIsUp
                        ? "Finalizing election..."
                        : `Head Chief elected in: ${hmmss}`}
                </Text>
            }
        />
    );
};
