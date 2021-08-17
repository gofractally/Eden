import { RiVideoUploadLine } from "react-icons/ri";

import {
    isValidDelegate,
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
    const { data } = useParticipantsInMyCompletedRound(roundIndex);
    const { data: participantsMemberData } = useMemberDataFromEdenMembers(
        data?.participants
    );

    if (!participantsMemberData || !participantsMemberData.length) return null;

    const commonDelegate = data?.participants.find(
        (p) => p.account === data.delegate
    );

    return (
        <Expander
            header={
                <RoundHeader
                    isRoundActive={false}
                    headlineComponent={<div>"Round "{roundIndex + 1}</div>}
                    sublineComponent={
                        isValidDelegate(commonDelegate?.account)
                            ? `Delegate elect: ${commonDelegate!.name}`
                            : "Consensus not achieved"
                    }
                />
            }
            inactive
        >
            <MembersGrid members={participantsMemberData}>
                {(member) => {
                    if (member.account === commonDelegate?.account) {
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
