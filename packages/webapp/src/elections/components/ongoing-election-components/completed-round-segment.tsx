import { RiVideoUploadLine } from "react-icons/ri";

import {
    useMemberDataFromEdenMembers,
    useParticipantsInMyCompletedRound,
} from "_app";
import { Button, Container, Expander, Text } from "_app/ui";
import { ElectionParticipantChip } from "elections";
import { MembersGrid } from "members";

import RoundHeader from "./round-header";

interface CompletedRoundSegmentProps {
    roundIndex: number;
}

export const CompletedRoundSegment = ({
    roundIndex,
}: CompletedRoundSegmentProps) => {
    // TODO: Participants should be limited to only those in the round (we're getting extras right now)
    const { data } = useParticipantsInMyCompletedRound(roundIndex);
    const { data: participantsMemberData } = useMemberDataFromEdenMembers(
        data?.participants
    );

    if (!participantsMemberData || !participantsMemberData.length) return <></>; // TODO: Return something here.

    const winner = data?.participants.find((p) => p.account === data.delegate);

    return (
        <Expander
            header={<Header roundIndex={roundIndex} winner={winner?.name} />}
            inactive
        >
            <MembersGrid members={participantsMemberData}>
                {(member) => {
                    if (member.account === winner?.account) {
                        return (
                            <ElectionParticipantChip
                                key={`round-${roundIndex + 1}-winner`}
                                member={member}
                                delegateLevel="Delegate elect"
                                electionVideoCid="QmeKPeuSai8sbEfvbuVXzQUzYRsntL3KSj5Xok7eRiX5Fp/edenTest2ElectionRoom12.mp4"
                            />
                        );
                    }
                    return (
                        <ElectionParticipantChip
                            key={`round-${roundIndex + 1}-participant-${
                                member.account
                            }`}
                            member={member}
                        />
                    );
                }}
            </MembersGrid>
            <Container>
                <Button size="sm">
                    <RiVideoUploadLine size={18} className="mr-2" />
                    Upload round {roundIndex + 1} recording
                </Button>
            </Container>
        </Expander>
    );
};

export default CompletedRoundSegment;

interface HeaderProps {
    roundIndex: number;
    winner?: string;
}

const Header = ({ roundIndex, winner }: HeaderProps) => {
    return (
        <RoundHeader
            isRoundActive={false}
            headlineComponent={
                <Text size="sm" className="font-semibold">
                    Round {roundIndex + 1} completed
                </Text>
            }
            sublineComponent={
                <Text size="sm" className="tracking-tight">
                    {winner
                        ? `Delegate elect: ${winner}`
                        : "Consensus not achieved"}
                </Text>
            }
        />
    );
};
