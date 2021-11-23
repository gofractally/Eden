import { Flipper, Flipped } from "react-flip-toolkit";

import { VotingMemberChip } from "elections";
import { VoteData } from "elections/interfaces";
import { MemberNFT } from "members/interfaces";

interface VotingRoundParticipantsProps {
    members?: MemberNFT[];
    voteData: VoteData[];
    selectedMember: MemberNFT | null;
    onSelectMember: (member: MemberNFT) => void;
    userVotingFor?: string;
}

const VotingRoundParticipants = ({
    members = [],
    voteData,
    selectedMember,
    onSelectMember,
    userVotingFor,
}: VotingRoundParticipantsProps) => {
    const getVoteCountForMember = (member: MemberNFT) => {
        return voteData.filter((vd) => vd.candidate === member.account).length;
    };

    const sortMembersByVotes = [...members].sort(
        (a, b) => getVoteCountForMember(b) - getVoteCountForMember(a)
    );

    const selectMember = (member: MemberNFT) => {
        if (member.account === selectedMember?.account) return;
        onSelectMember(member);
    };

    // TODO: Add electionVideoCid prop value to <VotingMemberChip /> once we can display these.

    return (
        <Flipper flipKey={sortMembersByVotes}>
            <div className="grid grid-cols-1 gap-px">
                {sortMembersByVotes.map((member, index) => {
                    const voteInfo = voteData.find(
                        (vd) => vd.member === member.account
                    );
                    const votesReceived = voteData.filter(
                        (vd) => vd.candidate === member.account
                    ).length;
                    const votingFor =
                        members.find((m) => m.account === voteInfo?.candidate)
                            ?.name ?? voteInfo?.candidate;
                    return (
                        <Flipped
                            key={`leaderboard-${member.account}`}
                            flipId={`leaderboard-${member.account}`}
                        >
                            <VotingMemberChip
                                member={member}
                                isSelected={
                                    selectedMember?.account === member.account
                                }
                                hasCurrentMembersVote={
                                    member.account === userVotingFor
                                }
                                onSelect={() => selectMember(member)}
                                votesReceived={votesReceived}
                                votingFor={votingFor}
                                className="bg-white"
                                style={{
                                    zIndex: 10 + members.length - index,
                                }}
                            />
                        </Flipped>
                    );
                })}
            </div>
        </Flipper>
    );
};

export default VotingRoundParticipants;
