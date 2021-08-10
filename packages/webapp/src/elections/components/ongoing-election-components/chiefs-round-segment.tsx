import { RiVideoUploadLine } from "react-icons/ri";

import {
    useCurrentMember,
    useMemberDataFromVoteData,
    useVoteData,
} from "_app/hooks/queries";
import { Button, Container, Expander, Heading, Text } from "_app/ui";
import { DelegateChip } from "elections";
import { MembersGrid } from "members";

import RoundHeader from "./round-header";

interface RoundSegmentProps {
    roundIndex: number;
    roundEndTime: string;
}

// TODO: Much of the building up of the data shouldn't be done in the UI layer. What do we want the API to provide? What data does this UI really need? We could even define a new OngoingElection type to provide to this UI.
export const ChiefsRoundSegment = ({
    roundIndex,
    roundEndTime,
}: RoundSegmentProps) => {
    const { data: currentMember } = useCurrentMember();
    const { data: participantData } = useVoteData({ limit: 20 });
    const { data: members } = useMemberDataFromVoteData(participantData);

    // TODO: Handle Fetch Errors;
    if (!members || members?.length !== participantData?.length)
        return <Text>Error Fetching Members</Text>;

    const isUserParticipant = participantData?.some(
        (participant) => participant.member === currentMember?.account
    );

    // TODO: DelegateChip: Add configurable string of subtext ("Chief Delegate Elect")
    return (
        <Expander
            header={
                <RoundHeader
                    roundEndTime={roundEndTime}
                    roundIndex={roundIndex}
                />
            }
            startExpanded
            locked
        >
            <Container className="space-y-2">
                <Heading size={3}>Chief Delegates Elect</Heading>
                <Text>
                    In this round, the newly-elected Chief Delegates meet to
                    discuss their vision for the community. There is no voting
                    during this round, as the Head Chief is selected randomly in
                    order to compensate for incumbent advantage.
                </Text>
            </Container>
            <MembersGrid members={members}>
                {(member) => <DelegateChip member={member} />}
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
