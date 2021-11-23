import React, { useState } from "react";
import { useQueryClient } from "react-query";
import { BiCheck } from "react-icons/bi";

import { onError, useUALAccount } from "_app";
import {
    queryMemberGroupParticipants,
    useCurrentMember,
} from "_app/hooks/queries";
import { Button, Container } from "_app/ui";
import { MemberNFT } from "members/interfaces";
import { ActiveStateConfigType, VoteData } from "elections/interfaces";

import { setVote } from "../../../transactions";
import { VideoUploadButton } from "../video-upload-button";
import VotingRoundParticipants from "./voting-round-participants";

interface ParticipantsVotingPanelProps {
    members?: MemberNFT[];
    voteData: VoteData[];
    roundIndex: number;
    electionConfig?: ActiveStateConfigType;
}

export const ParticipantsVotingPanel = ({
    members,
    voteData,
    roundIndex,
    electionConfig,
}: ParticipantsVotingPanelProps) => {
    const [selectedMember, setSelected] = useState<MemberNFT | null>(null);
    const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);

    const queryClient = useQueryClient();

    const [ualAccount] = useUALAccount();
    const { data: loggedInMember } = useCurrentMember();

    const userVoterStats = voteData!.find(
        (vs) => vs.member === loggedInMember?.account
    );

    const userVotingFor = members?.find(
        (m) => m.account === userVoterStats?.candidate
    );

    const onSubmitVote = async () => {
        if (!selectedMember) return;
        setIsSubmittingVote(true);
        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = setVote(
                authorizerAccount,
                roundIndex,
                selectedMember?.account
            );
            await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });

            // invalidate current member query to update participating status
            await new Promise((resolve) => setTimeout(resolve, 3000));
            queryClient.invalidateQueries(
                queryMemberGroupParticipants(
                    loggedInMember?.account,
                    roundIndex,
                    electionConfig
                ).queryKey
            );
        } catch (error) {
            console.error(error);
            onError(error as Error);
        }
        setIsSubmittingVote(false);
    };

    return (
        <>
            <VotingRoundParticipants
                members={members}
                voteData={voteData}
                selectedMember={selectedMember}
                onSelectMember={(m) => setSelected(m)}
                userVotingFor={userVotingFor?.account}
            />
            <Container>
                <div className="flex flex-col sm:flex-row justify-around items-center space-y-3 sm:space-y-0 md:px-16">
                    <div className="hidden sm:block lg:hidden">
                        <VideoUploadButton buttonType="link" />
                    </div>
                    <VoteButton
                        selectedMember={selectedMember}
                        isSubmittingVote={isSubmittingVote}
                        userVotingFor={userVotingFor}
                        onSubmitVote={onSubmitVote}
                    />
                    <div className="sm:hidden">
                        <VideoUploadButton buttonType="link" />
                    </div>
                </div>
            </Container>
        </>
    );
};

export default ParticipantsVotingPanel;

interface VoteButtonProps {
    selectedMember: MemberNFT | null;
    isSubmittingVote: boolean;
    userVotingFor?: MemberNFT;
    onSubmitVote: () => Promise<void>;
}

const VoteButton = ({
    selectedMember,
    isSubmittingVote,
    userVotingFor,
    onSubmitVote,
}: VoteButtonProps) => (
    <Button
        disabled={
            !selectedMember ||
            isSubmittingVote ||
            userVotingFor?.account === selectedMember.account
        }
        onClick={onSubmitVote}
        isLoading={isSubmittingVote}
    >
        {!isSubmittingVote && <BiCheck size={21} className="-mt-1 mr-1" />}
        {isSubmittingVote
            ? "Submitting vote"
            : userVotingFor
            ? "Change vote"
            : "Submit vote"}
    </Button>
);
