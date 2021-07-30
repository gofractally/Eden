import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Flipper, Flipped } from "react-flip-toolkit";
import { BiCheck, BiWebcam } from "react-icons/bi";
import { FaCheckCircle } from "react-icons/fa";
import { GoSync } from "react-icons/go";
import { RiVideoUploadLine } from "react-icons/ri";

import { FluidLayout, queryMembers, useFormFields, useUALAccount } from "_app";
import {
    Button,
    Container,
    Expander,
    Form,
    Heading,
    Modal,
    Text,
} from "_app/ui";
import {
    CountdownPieMer,
    ElectionParticipantChip,
    VotingMemberChip,
} from "elections";
import { MembersGrid } from "members";
import { MemberData } from "members/interfaces";

interface Props {
    delegatesPage: number;
}

const MEMBERS_PAGE_SIZE = 4;

// TODO: Hook up to real/fixture data; break apart and organize
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
                </Container>
                <Container darkBg>
                    <Heading size={2}>Today's Election</Heading>
                    <Text>In progress until 6:30pm EDT</Text>
                </Container>
                <SupportSegment />
                {members && (
                    <CompletedRoundSegment
                        round={1}
                        participants={members}
                        winner={members[4]}
                    />
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
                <Text className="font-semibold">
                    Community Room &amp; Support
                </Text>
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
    participants: MemberData[];
    winner?: MemberData;
}

const CompletedRoundSegment = ({
    round,
    participants,
    winner,
}: CompletedRoundSegmentProps) => (
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
    const [ualAccount] = useUALAccount();
    const [selectedMember, setSelected] = useState<MemberData | null>(null);
    const [votedFor, setVotedFor] = useState<MemberData | null>(null);
    const [
        showZoomLinkPermutations,
        setShowZoomLinkPermutations,
    ] = useState<boolean>(false);
    // may need to push this password prompt state up
    const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(
        false
    );

    const onSelectMember = (member: MemberData) => {
        if (member.account === selectedMember?.account) return;
        setSelected(member);
    };

    const onSubmitVote = () => setVotedFor(selectedMember);

    // TODO: If we want the list leaderboard flipper animation, we'll want to poll with the query and sort round participants by number of votes.
    // Then we'll feed that into the Flipper instance below.
    const sortMembersByVotes = useMemo(() => {
        const getVoteCount = (m: MemberData) =>
            m.account === votedFor?.account ? 1 : 0;
        return [...members].sort((a, b) => getVoteCount(b) - getVoteCount(a));
    }, [votedFor?.account]);

    return (
        <Expander
            header={<RoundHeader roundNum={round} subText={time} isActive />}
            startExpanded
            locked
        >
            <Container className="space-y-2">
                <Heading size={3}>Meeting group members</Heading>
                <Text>
                    Meet with your group. Align on a leader &gt;2/3 majority.
                    Select your leader and submit your vote below.
                </Text>
                {!showZoomLinkPermutations ? (
                    <Button
                        size="sm"
                        onClick={() => setShowZoomLinkPermutations(true)}
                    >
                        <BiWebcam className="mr-1" />
                        Request meeting link
                    </Button>
                ) : (
                    <>
                        <div className="flex items-center space-x-2">
                            <Button size="sm">
                                <BiWebcam className="mr-1" />
                                Request meeting link
                            </Button>
                            <Text
                                size="xs"
                                type="note"
                                className="leading-tight"
                            >
                                [Not implemented] No one has created
                                <br />a link yet. Should trigger Zoom Oauth.
                            </Text>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                size="sm"
                                onClick={() => setShowPasswordPrompt(true)}
                            >
                                <BiWebcam className="mr-1" />
                                Request meeting link
                            </Button>
                            <Text
                                size="xs"
                                type="note"
                                className="leading-tight"
                            >
                                [Opens modal UI] Link created,
                                <br />
                                but password not set in browser.
                            </Text>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button size="sm">
                                <BiWebcam className="mr-1" />
                                Join meeting
                            </Button>
                            <Text
                                size="xs"
                                type="note"
                                className="leading-tight"
                            >
                                [Not implemented] Poll for encrypted link. If
                                found
                                <br />
                                automatically decrypt and show join button.
                            </Text>
                        </div>
                    </>
                )}
            </Container>
            <Flipper flipKey={sortMembersByVotes}>
                <MembersGrid members={sortMembersByVotes}>
                    {(member, index) => (
                        <Flipped
                            key={`leaderboard-${member.account}`}
                            flipId={`leaderboard-${member.account}`}
                        >
                            <VotingMemberChip
                                member={member}
                                isSelected={
                                    selectedMember?.account === member.account
                                }
                                onSelect={() => onSelectMember(member)}
                                votesReceived={
                                    votedFor?.account === member.account ? 1 : 0
                                }
                                votingFor={
                                    ualAccount?.accountName === member.account
                                        ? votedFor?.name
                                        : undefined
                                } // actual data will likely inform changes to the props implementation on this component.
                                electionVideoCid={
                                    ualAccount?.accountName === member.account
                                        ? "QmeKPeuSai8sbEfvbuVXzQUzYRsntL3KSj5Xok7eRiX5Fp/edenTest2ElectionRoom12.mp4"
                                        : undefined
                                } // TODO: this will obviously change once implemented too
                                className="bg-white"
                                style={{ zIndex: 10 + members.length - index }}
                            />
                        </Flipped>
                    )}
                </MembersGrid>
            </Flipper>
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
                        Upload round {round} recording
                    </Button>
                </div>
            </Container>
            <PasswordPromptModal
                isOpen={showPasswordPrompt}
                close={() => setShowPasswordPrompt(false)}
            />
        </Expander>
    );
};

// TODO: Make more data-driven. E.g., infer if round is active based on time passed in, etc. Props will change.
const RoundHeader = ({
    roundNum,
    isActive,
    subText,
}: {
    roundNum: number;
    isActive?: boolean;
    subText: string;
}) => {
    const startTime = useMemo(() => new Date(), []);
    const endTime = useMemo(
        () => new Date(startTime.getTime() + 3 * 60 * 1000), // 3 min
        []
    );
    return (
        <div className="w-full flex justify-between">
            <div className="flex items-center space-x-2">
                {isActive ? (
                    <GoSync size={24} className="text-gray-400" />
                ) : (
                    <FaCheckCircle size={22} className="ml-px text-gray-400" />
                )}
                <div>
                    <Text size="sm" className="font-semibold">
                        Round {roundNum}
                    </Text>
                    <Text size="sm">{subText}</Text>
                </div>
            </div>
            {isActive && (
                <CountdownPieMer
                    startTime={startTime}
                    endTime={endTime}
                    className="mr-16"
                />
            )}
        </div>
    );
};

interface ModalProps {
    isOpen: boolean;
    close: () => void;
}

const PasswordPromptModal = ({ isOpen, close }: ModalProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fields, setFields] = useFormFields({ password: "" });
    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setIsLoading(false);
        setFields({ target: { id: "password", value: "" } });
        close();
    };

    return (
        <Modal
            isOpen={isOpen}
            title="Activate Meeting Link"
            onRequestClose={close}
            contentLabel="Meeting Link Activation Modal - Requesting Password"
            preventScroll
            shouldCloseOnOverlayClick={!isLoading}
            shouldCloseOnEsc={!isLoading}
        >
            <div className="space-y-4">
                <Text>
                    Enter your election password below to activate your meeting
                    links on this device.
                </Text>
                <form onSubmit={onSubmit} className="space-y-3">
                    <Form.LabeledSet
                        label="Your Election Password"
                        htmlFor="password"
                        className="col-span-6 sm:col-span-3"
                    >
                        <Form.Input
                            id="password"
                            type="text"
                            required
                            value={fields.password}
                            onChange={onChangeFields}
                        />
                    </Form.LabeledSet>
                    <div className="flex space-x-3">
                        <Button
                            type="neutral"
                            onClick={close}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            isSubmit
                            isLoading={isLoading}
                            disabled={!fields.password || isLoading}
                        >
                            {isLoading ? "Submitting..." : "Submit"}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
