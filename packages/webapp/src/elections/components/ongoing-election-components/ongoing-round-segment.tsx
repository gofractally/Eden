import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { Flipper, Flipped } from "react-flip-toolkit";
import { BiCheck, BiWebcam } from "react-icons/bi";
import { RiVideoUploadLine } from "react-icons/ri";

import { queryMembers } from "_app";
import {
    useCurrentMember,
    useMemberGroupParticipants,
    useMemberListByAccountNames,
} from "_app/hooks/queries";
import { Button, Container, Expander, Heading, Text } from "_app/ui";
import { VotingMemberChip } from "elections";
import { MembersGrid } from "members";
import { EdenMember, MemberData } from "members/interfaces";
import { VoteData } from "elections/interfaces";

import Consensometer from "./consensometer";
import PasswordPromptModal from "./password-prompt-modal";
import RoundHeader from "./round-header";

interface OngoingRoundSegmentProps {
    roundData: any;
}

// TODO: Much of the building up of the data shouldn't be done in the UI layer. What do we want the API to provide? What data does this UI really need? We could even define a new OngoingElection type to provide to this UI.
export const OngoingRoundSegment = ({
    roundData,
}: OngoingRoundSegmentProps) => {
    const [fetchError, setFetchError] = useState<boolean>(false);
    const [voterStats, setVoterStats] = useState<VoteData[]>([]); // TODO: Remove; only here to facilitate mock voting
    const [selectedMember, setSelected] = useState<MemberData | null>(null);
    const [
        showZoomLinkPermutations,
        setShowZoomLinkPermutations,
    ] = useState<boolean>(false); // TODO: Replace with real meeting link functionality
    const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(
        false
    ); // TODO: Hook up to the real password prompt

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

    useEffect(() => {
        const roundMemberError = roundEdenMembers.some((res) => res.isError);
        if (roundMemberError) {
            setFetchError(true);
        } else {
            setFetchError(false);
        }
    }, [roundEdenMembers]);

    const { data: members } = useQuery({
        ...queryMembers(1, 20, nftTemplateIds),
        staleTime: Infinity,
        enabled: !fetchError && Boolean(nftTemplateIds.length),
    });

    // TODO: Handle Fetch Errors;
    if (fetchError) return <Text>Fetch Error</Text>;
    if (!members || members?.length !== voteData?.length)
        return <Text>Error Fetching Members</Text>;

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
            header={<RoundHeader roundData={roundData} />}
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
            <Container className="flex justify-between items-center">
                <Heading size={4} className="inline-block">
                    Consensus
                </Heading>
                <Consensometer voteData={voterStats} />
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
