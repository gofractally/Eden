import { useQuery } from "react-query";
import { RiVideoUploadLine } from "react-icons/ri";

import { queryMembers } from "_app";
import { Button, Container, Expander } from "_app/ui";
import { ElectionParticipantChip } from "elections";
import { MembersGrid } from "members";

import RoundHeader from "./round-header";

interface CompletedRoundSegmentProps {
    round: number;
}

export const CompletedRoundSegment = ({
    round,
}: CompletedRoundSegmentProps) => {
    // TODO: The number of completed rounds is generated based on fixture data, but the contents are still mocked. Fill in contents!
    const { data: participants } = useQuery({
        ...queryMembers(1, 5),
        staleTime: Infinity,
    });

    if (!participants) return <></>;

    const winner = participants[2]; // TODO: This should be the real winner; I'm just picking a random one for now.

    return (
        <Expander
            header={
                <RoundHeader
                    roundNum={round}
                    subText={
                        winner
                            ? `Delegate elect: ${winner.name}`
                            : "Consensus not achieved"
                    }
                />
            }
            inactive
        >
            <MembersGrid members={participants}>
                {(member) => {
                    if (member.account === winner?.account) {
                        return (
                            <ElectionParticipantChip
                                key={`round-${round}-winner`}
                                member={member}
                                delegateLevel="Delegate elect"
                                electionVideoCid="QmeKPeuSai8sbEfvbuVXzQUzYRsntL3KSj5Xok7eRiX5Fp/edenTest2ElectionRoom12.mp4"
                            />
                        );
                    }
                    return (
                        <ElectionParticipantChip
                            key={`round-${round}-participant-${member.account}`}
                            member={member}
                        />
                    );
                }}
            </MembersGrid>
            <Container>
                <Button size="sm">
                    <RiVideoUploadLine size={18} className="mr-2" />
                    Upload round {round} recording
                </Button>
            </Container>
        </Expander>
    );
};

export default CompletedRoundSegment;
