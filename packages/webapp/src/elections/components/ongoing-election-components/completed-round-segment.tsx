import {
    isValidDelegate,
    useMemberDataFromEdenMembers,
    useParticipantsInMyCompletedRound,
} from "_app";
import { Container, Expander, Text } from "_app/ui";
import { ElectionParticipantChip } from "elections";
import { EdenMember, MembersGrid } from "members";

import RoundHeader from "./round-header";
import { VideoUploadButton } from "../video-upload-button";

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
        (p: EdenMember) => p.account === data?.delegate?.account
    );

    return (
        <Expander
            header={<Header roundIndex={roundIndex} winner={commonDelegate} />}
            type="inactive"
        >
            <MembersGrid members={participantsMemberData}>
                {(member) => {
                    if (member.account === commonDelegate?.account) {
                        return (
                            <ElectionParticipantChip
                                key={`round-${roundIndex + 1}-winner`}
                                member={member}
                                delegateLevel="Delegate elect"
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
                <VideoUploadButton buttonType="link" />
            </Container>
        </Expander>
    );
};

export default CompletedRoundSegment;

interface HeaderProps {
    roundIndex: number;
    winner?: EdenMember;
}

const Header = ({ roundIndex, winner }: HeaderProps) => {
    const subText = isValidDelegate(winner?.account)
        ? `Delegate elect: ${winner?.name}`
        : "Consensus not achieved";
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
                    {subText}
                </Text>
            }
        />
    );
};
