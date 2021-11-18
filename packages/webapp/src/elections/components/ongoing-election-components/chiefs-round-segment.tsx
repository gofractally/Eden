import { useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";

import { useCountdown } from "_app";
import {
    useCurrentMember,
    useMemberDataFromVoteData,
    useVoteData,
} from "_app/hooks/queries";
import { Container, Expander, Heading, Loader, Text } from "_app/ui";
import { DelegateChip, ErrorLoadingElection } from "elections";
import { MembersGrid } from "members";
import { VideoUploadButton } from "./video-upload-button";

import RoundHeader from "./round-header";

interface RoundSegmentProps {
    roundEndTime: Dayjs;
    onRoundEnd: () => void;
}

export const ChiefsRoundSegment = ({
    roundEndTime,
    onRoundEnd,
}: RoundSegmentProps) => {
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

    useEffect(() => {
        if (dayjs().isAfter(roundEndTime)) {
            // if mounted after end of round but before results processed,
            // we call this to trigger polling for next state
            onRoundEnd();
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
                    onEndCountdown={onRoundEnd}
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
                    <VideoUploadButton buttonType="link" />
                </Container>
            )}
        </Expander>
    );
};

export default ChiefsRoundSegment;

interface HeaderProps {
    roundEndTime: Dayjs;
    onEndCountdown: () => void;
}

const Header = ({ roundEndTime, onEndCountdown: onEnd }: HeaderProps) => {
    const { msRemaining, hmmss } = useCountdown({
        endTime: roundEndTime.toDate(),
        onEnd,
    });
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
                    {msRemaining === 0
                        ? "Finalizing election..."
                        : `Head Chief elected in: ${hmmss}`}
                </Text>
            }
        />
    );
};
