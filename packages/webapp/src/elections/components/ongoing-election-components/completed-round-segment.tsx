import { RiVideoUploadLine } from "react-icons/ri";

import {
    useMemberDataFromEdenMembers,
    useParticipantsInCompletedRound,
} from "_app";
import { Button, Container, Expander } from "_app/ui";
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
    const { data } = useParticipantsInCompletedRound(roundIndex);
    const { data: participantsMemberData } = useMemberDataFromEdenMembers(data);
    console.log("ROUND PARTICIPANTS:", data);

    if (!participantsMemberData || !participantsMemberData.length) return <></>; // TODO: Return something here.

    const winner = participantsMemberData[2]; // TODO: This should be the real winner; I'm just picking a random one for now.

    return (
        <Expander
            header={
                <RoundHeader
                    roundNum={roundIndex + 1}
                    subText={
                        winner
                            ? `Delegate elect: ${winner.name}`
                            : "Consensus not achieved"
                    }
                />
            }
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
