import React, { useState } from "react";
import { useQuery } from "react-query";
import { BiCheck, BiWebcam } from "react-icons/bi";
import { FaCheckCircle } from "react-icons/fa";
import { GoSync } from "react-icons/go";
import { IoIosLink } from "react-icons/io";
import { RiVideoUploadLine } from "react-icons/ri";

import { FluidLayout, queryMembers } from "_app";
import { Button, Container, Expander, Heading, Text } from "_app/ui";
import { DelegateChip, VotingMemberChip } from "elections";
import { MembersGrid } from "members";
import { MemberData } from "members/interfaces";

interface Props {
    delegatesPage: number;
}

const MEMBERS_PAGE_SIZE = 4;

// TODO: Hook up to real/fixture data
export const OngoingElectionPage = (props: Props) => {
    const { data: members } = useQuery({
        ...queryMembers(1, MEMBERS_PAGE_SIZE),
        keepPreviousData: true,
    });

    return (
        <FluidLayout title="Election">
            <div className="divide-y">
                <Container>
                    <Heading size={1}>Election</Heading>
                    <Text size="sm">In progress until 6:30pm EDT</Text>
                </Container>
                <SupportSegment />
                {members && (
                    <CompletedRoundSegment round={1} winner={members[4]} />
                )}
                {members && (
                    <OngoingRoundSegment
                        members={members}
                        round={2}
                        time="11:30am - 12:30am"
                    />
                )}
            </div>
        </FluidLayout>
    );
};

export default OngoingElectionPage;

const SupportSegment = () => (
    <Expander
        header={
            <div className="flex justify-center items-center space-x-2">
                <GoSync size={24} className="text-gray-400" />
                <Heading size={4}>Community Room &amp; Support</Heading>
            </div>
        }
    >
        <Container>
            <Button size="sm">
                <BiWebcam className="mr-1" />
                Join meeting
            </Button>
        </Container>
    </Expander>
);

interface CompletedRoundSegmentProps {
    round: number;
    winner: MemberData;
}

const CompletedRoundSegment = ({
    round,
    winner,
}: CompletedRoundSegmentProps) => (
    <Expander
        header={
            <div className="flex items-center space-x-2">
                <FaCheckCircle size={22} className="ml-px text-gray-400" />
                <div>
                    <Heading size={4}>Round {round}</Heading>
                    <Text>Delegate elect: {winner.name}</Text>
                </div>
            </div>
        }
    >
        <MembersGrid members={[winner]}>
            {(member) => (
                <DelegateChip key={`round-${round}-winner`} member={member} />
            )}
        </MembersGrid>
    </Expander>
);

interface OngoingRoundSegmentProps {
    members: MemberData[];
    round: number;
    time: string;
}

const OngoingRoundSegment = ({
    members,
    round,
    time,
}: OngoingRoundSegmentProps) => {
    const [selectedMember, setSelected] = useState<MemberData | null>(null);
    const [votedFor, setVotedFor] = useState<MemberData | null>(null);

    const onSelectMember = (member: MemberData) => {
        if (member.account === selectedMember?.account) return;
        setSelected(member);
    };

    const onSubmitVote = () => setVotedFor(selectedMember);

    return (
        <Expander
            header={
                <div className="flex items-center space-x-2">
                    <GoSync size={24} className="text-gray-400" />
                    <div>
                        <Heading size={4}>Round {round}</Heading>
                        <Text>{time}</Text>
                    </div>
                </div>
            }
            startExpanded
        >
            <Container className="space-y-2">
                <Heading size={2}>Meeting group members</Heading>
                <Text>
                    Meet with your group. Align on a leader &gt;2/3 majority.
                    Select your leader and submit your vote below.
                </Text>
                <Button size="sm">
                    <IoIosLink size={18} className="-ml-px mr-1" />
                    Request meeting link
                </Button>
            </Container>
            <MembersGrid members={members || []}>
                {(member) => (
                    <VotingMemberChip
                        key={member.account}
                        member={member}
                        isSelected={selectedMember?.account === member.account}
                        onSelect={() => onSelectMember(member)}
                    />
                )}
            </MembersGrid>
            <Container>
                {votedFor && (
                    <div className="text-center mb-2">
                        You voted for: {votedFor.name}
                    </div>
                )}
                <div className="flex flex-col xs:flex-row justify-center space-y-2 xs:space-y-0 xs:space-x-2">
                    <Button
                        size="sm"
                        disabled={
                            !selectedMember ||
                            votedFor?.account === selectedMember.account
                        }
                        onClick={onSubmitVote}
                    >
                        <BiCheck size={21} className="-mt-1 mr-1" />
                        {votedFor ? "Change Vote" : "Submit Vote"}
                    </Button>
                    <Button size="sm">
                        <RiVideoUploadLine size={18} className="mr-2" />
                        Upload meeting video
                    </Button>
                </div>
            </Container>
        </Expander>
    );
};
