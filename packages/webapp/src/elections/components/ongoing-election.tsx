import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { Flipper, Flipped } from "react-flip-toolkit";
import { BiCheck, BiWebcam } from "react-icons/bi";
import { FaCheckCircle } from "react-icons/fa";
import { GoSync } from "react-icons/go";
import { RiVideoUploadLine } from "react-icons/ri";
import dayjs, { Dayjs } from "dayjs";

import { FluidLayout, queryMembers, useFormFields, useUALAccount } from "_app";
import {
    useCurrentElection,
    useCurrentMember,
    useMemberGroupParticipants,
    useMemberListByAccountNames,
} from "_app/hooks/queries";
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
import { EdenMember, MemberData } from "members/interfaces";
import { VoteData } from "elections/interfaces";
import { EncryptionPasswordAlert } from "encryption";

// TODO: Much of the building up of the data shouldn't be done in the UI layer. What do we want the API to provide. What data does this UI really need? We can define a new OngoingElection type to provide to this UI.
// TODO: Hook up to real/fixture data; break apart and organize
// TODO: Make sure time zone changes during election are handled properly
export const OngoingElection = () => {
    const { data: currentElection } = useCurrentElection();

    return (
        <FluidLayout title="Election">
            <div className="divide-y">
                <EncryptionPasswordAlert promptSetupEncryptionKey />
                <Container>
                    <Heading size={1}>Election</Heading>
                </Container>
                <Container darkBg>
                    <Heading size={2}>Today's Election</Heading>
                    <Text>In progress until 6:30pm EDT</Text>
                </Container>
                <SupportSegment />
                {/* TODO: How do we get previous round info? Do that here. */}
                {currentElection?.round &&
                    [...Array(currentElection.round - 1)].map((_, i) => (
                        <CompletedRoundSegment
                            key={`election-round-${i + 1}`}
                            round={i + 1}
                        />
                    ))}
                {currentElection && (
                    <OngoingRoundSegment roundData={currentElection} />
                )}
            </div>
        </FluidLayout>
    );
};

export default OngoingElection;

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
}

const CompletedRoundSegment = ({ round }: CompletedRoundSegmentProps) => {
    // TODO: The number of completed rounds is generated based on fixture data, but the contents are still mocked. Fill in contents!
    const { data: participants } = useQuery({
        ...queryMembers(1, 5),
        staleTime: Infinity,
    });

    if (!participants) return <></>;

    const winner = participants[2];

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

interface OngoingRoundSegmentProps {
    roundData: any;
}

const OngoingRoundSegment = ({ roundData }: OngoingRoundSegmentProps) => {
    const [fetchError, setFetchError] = useState<boolean>(false);
    const [voterStats, setVoterStats] = useState<VoteData[]>([]);
    const [selectedMember, setSelected] = useState<MemberData | null>(null);
    const [
        showZoomLinkPermutations,
        setShowZoomLinkPermutations,
    ] = useState<boolean>(false);
    // may need to push this password prompt state up
    const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(
        false
    );

    const { data: loggedInMember } = useCurrentMember();

    const { data: voteData } = useMemberGroupParticipants(
        loggedInMember?.account
    );

    useEffect(() => {
        if (voteData) setVoterStats(voteData);
    }, [voteData]);

    const roundEdenMembers = useMemberListByAccountNames(
        voteData?.map((participant) => participant.member) ?? []
    );

    const nftTemplateIds: number[] = roundEdenMembers
        ?.filter((res) => Boolean(res?.data?.nft_template_id))
        ?.map((res) => res?.data as EdenMember)
        .map((em) => em.nft_template_id);

    const { data: members } = useQuery({
        ...queryMembers(1, 20, nftTemplateIds),
        staleTime: Infinity,
        enabled: !fetchError && Boolean(nftTemplateIds.length),
    });

    useEffect(() => {
        const roundMemberError = roundEdenMembers.some((res) => res.isError);
        const memberDataError = voteData?.length === members?.length;
        if (roundMemberError || memberDataError) {
            setFetchError(true);
        } else {
            setFetchError(false);
        }
    }, [members, roundEdenMembers]);

    // TODO: Handle fetchError;

    if (!members) return <></>;

    const endDateTime = dayjs(roundData.round_end + "Z");
    const startDateTime = endDateTime.subtract(40, "minute");

    // console.log(end.format("LT"));
    // console.log(end.subtract(40, "minute").format("LT"));

    const onSelectMember = (member: MemberData) => {
        if (member.account === selectedMember?.account) return;
        setSelected(member);
    };

    const userVoterStats = voterStats.find(
        (vs) => vs.member === loggedInMember?.account
    );

    const userVotingFor = members.find(
        (m) => m.account === userVoterStats?.candidate
    );

    // TODO: Sign & push vote action; remove voterStats and switch back to relying on voteData
    const onSubmitVote = () => {
        setVoterStats([
            ...voterStats.filter((vs) => vs.member !== loggedInMember?.account),
            {
                ...userVoterStats!,
                candidate: selectedMember?.account ?? "",
            },
        ]);
    };

    // TODO: If we want the list leaderboard flipper animation, we'll want to poll with the query and sort round participants by number of votes.
    // Then we'll feed that into the Flipper instance below.
    const getVoteCountForMember = (member: MemberData) => {
        return voterStats.filter((vd) => vd.candidate === member.account)
            .length;
    };

    const sortMembersByVotes = [...members].sort(
        (a, b) => getVoteCountForMember(b) - getVoteCountForMember(a)
    );

    return (
        <Expander
            header={
                <RoundHeader
                    roundNum={roundData.round}
                    subText={`${startDateTime.format(
                        "LT"
                    )} - ${endDateTime.format("LT z")}`}
                    endDateTime={endDateTime}
                    startDateTime={startDateTime}
                    isActive
                />
            }
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
                    {(member, index) => {
                        const voteInfo = voterStats.find(
                            (vd) => vd.member === member.account
                        );
                        const votesReceived = voterStats.filter(
                            (vd) => vd.candidate === member.account
                        ).length;
                        return (
                            <Flipped
                                key={`leaderboard-${member.account}`}
                                flipId={`leaderboard-${member.account}`}
                            >
                                <VotingMemberChip
                                    member={member}
                                    isSelected={
                                        selectedMember?.account ===
                                        member.account
                                    }
                                    onSelect={() => onSelectMember(member)}
                                    votesReceived={votesReceived}
                                    votingFor={voteInfo?.candidate}
                                    electionVideoCid={
                                        loggedInMember?.account ===
                                        member.account
                                            ? "QmeKPeuSai8sbEfvbuVXzQUzYRsntL3KSj5Xok7eRiX5Fp/edenTest2ElectionRoom12.mp4"
                                            : undefined
                                    } // TODO: this will obviously change once implemented too
                                    className="bg-white"
                                    style={{
                                        zIndex: 10 + members.length - index,
                                    }}
                                />
                            </Flipped>
                        );
                    }}
                </MembersGrid>
            </Flipper>
            <Container>
                {userVotingFor && (
                    <div className="text-center mb-2">
                        You voted for: {userVotingFor.name}
                    </div>
                )}
                <div className="flex flex-col xs:flex-row justify-center space-y-2 xs:space-y-0 xs:space-x-2">
                    <Button
                        size="sm"
                        disabled={
                            !selectedMember ||
                            userVotingFor?.account === selectedMember.account
                        }
                        onClick={onSubmitVote}
                    >
                        <BiCheck size={21} className="-mt-1 mr-1" />
                        {userVotingFor ? "Change Vote" : "Submit Vote"}
                    </Button>
                    <Button size="sm">
                        <RiVideoUploadLine size={18} className="mr-2" />
                        Upload round {roundData.round} recording
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
    startDateTime,
    endDateTime,
    subText,
}: {
    roundNum: number;
    isActive?: boolean;
    startDateTime?: Dayjs;
    endDateTime?: Dayjs;
    subText: string;
}) => {
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
                    <Text size="sm" className="tracking-tight">
                        {subText}
                    </Text>
                </div>
            </div>
            {isActive && startDateTime && endDateTime && (
                <CountdownPieMer
                    startTime={startDateTime.toDate()}
                    endTime={endDateTime.toDate()}
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
