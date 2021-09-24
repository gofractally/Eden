import React, { useEffect, useState } from "react";
import { RiVideoUploadLine } from "react-icons/ri";
import dayjs from "dayjs";

import {
    SideNavLayout,
    isValidDelegate,
    onError,
    uploadIpfsFileWithTransaction,
    uploadToIpfs,
    useCurrentElection,
    useUALAccount,
    useElectionState,
    useCurrentMemberElectionVotingData,
} from "_app";
import {
    Container,
    Text,
    Expander,
    Heading,
    Loader,
    VideoSubmissionFormAndPreview,
    VideoSubmissionPhase,
} from "_app/ui";

import {
    CurrentElection,
    ElectionStatus,
    ErrorLoadingElection,
    setElectionRoundVideo,
} from "elections";
import { RoundHeader } from "elections/components/ongoing-election-components";
import { MemberAccountData, MemberGateContainer } from "members";

export const RoundVideoUploadPage = () => {
    const {
        data: currentElection,
        isLoading: isLoadingElection,
        isError: isErrorElection,
    } = useCurrentElection();
    const {
        data: electionState,
        isLoading: isLoadingElectionState,
        isError: isErrorElectionState,
    } = useElectionState();

    const isLoading = isLoadingElection || isLoadingElectionState;
    const isError = isErrorElection || isErrorElectionState;

    if (isLoading) return <LoaderSection />;
    if (isError || !currentElection) return <ErrorLoadingElection />;

    const uploadLimitTime = electionState
        ? dayjs(electionState.last_election_time + "Z").add(48, "hour")
        : dayjs().add(1, "day");

    const isUploadExpired =
        dayjs().isAfter(uploadLimitTime) &&
        currentElection?.electionState === ElectionStatus.Registration;

    return (
        <SideNavLayout title="Election video upload service">
            <div className="divide-y">
                <Container>
                    <Heading size={1}>Election video upload service</Heading>
                </Container>
                <Container className="space-y-6 pb-5">
                    {isUploadExpired ? (
                        <div>
                            Election is complete and upload videos time is
                            expired.
                        </div>
                    ) : (
                        <>
                            <Text>
                                Election video files are typically large and
                                require many minutes to upload completely. Do
                                not close this tab during the upload. A
                                confirmation will be displayed when your upload
                                is complete.
                            </Text>
                            <Text>
                                Be patient, and remember you have 48 hours from
                                the beginning of the election to complete your
                                election video uploads.
                            </Text>
                        </>
                    )}
                </Container>
                <MemberGateContainer>
                    {!isUploadExpired && <RoundVideoUploadList />}
                </MemberGateContainer>
            </div>
        </SideNavLayout>
    );
};

export default RoundVideoUploadPage;

const RoundVideoUploadList = () => {
    const [ualAccount] = useUALAccount();
    const {
        data: currentMemberElectionVotingData,
        isLoading: isLoadingCurrentMemberElectionVotingData,
        isError: isErrorCurrentMemberElectionVotingData,
    } = useCurrentMemberElectionVotingData(ualAccount?.accountName);
    const [videoSubmissionPhase, setVideoSubmissionPhase] = useState<
        VideoSubmissionPhase | undefined
    >(undefined);
    const [uploadCompleteMessage, setUploadCompleteMessage] = useState({
        roundIndex: 0,
        message: "",
    });

    if (isLoadingCurrentMemberElectionVotingData) {
        return <LoaderSection />;
    } else if (isErrorCurrentMemberElectionVotingData) {
        return <ErrorLoadingElection />;
    }

    if (
        !currentMemberElectionVotingData ||
        !currentMemberElectionVotingData.votes.length
    )
        return (
            <Container>
                <Text>
                    It appears you haven't participated in any election round.
                    Nothing to upload.
                </Text>
            </Container>
        );

    const submitElectionRoundVideo = (roundIndex: number) => async (
        videoFile: File
    ) => {
        try {
            setVideoSubmissionPhase("uploading");
            const videoHash = await uploadToIpfs(videoFile);

            const authorizerAccount = ualAccount.accountName;
            const transaction = setElectionRoundVideo(
                authorizerAccount,
                roundIndex,
                videoHash
            );
            console.info(transaction);
            setVideoSubmissionPhase("signing");
            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: false,
                expireSeconds: 1200,
            });
            console.info("electvideo trx", signedTrx);

            setVideoSubmissionPhase("finishing");
            await uploadIpfsFileWithTransaction(
                signedTrx,
                videoHash,
                videoFile
            );

            setVideoSubmissionPhase(undefined);
            setUploadCompleteMessage({
                roundIndex,
                message: "Election video uploaded successfully!",
            });
        } catch (error) {
            onError(error as Error, "Unable to set the election round video");
            setVideoSubmissionPhase(undefined);
        }
    };

    return (
        <>
            {currentMemberElectionVotingData.votes.map((vote) => {
                return (
                    <div key={`video-round-${vote.roundIndex}`}>
                        <Expander
                            header={
                                <Header
                                    isOngoing={
                                        vote.votingStarted &&
                                        !vote.votingFinished
                                    }
                                    roundIndex={vote.roundIndex}
                                    winner={vote.winner}
                                    roundStartTime={vote.votingBegin}
                                    roundEndTime={vote.votingEnd}
                                />
                            }
                            startExpanded
                            darkBg={true}
                        >
                            <Container>
                                <VideoSubmissionFormAndPreview
                                    uid={vote.roundIndex}
                                    video={vote.video}
                                    onSubmit={submitElectionRoundVideo(
                                        vote.roundIndex
                                    )}
                                    submissionPhase={videoSubmissionPhase}
                                    submitButtonIcon={
                                        <RiVideoUploadLine
                                            size={18}
                                            className="mr-2"
                                        />
                                    }
                                    submitButtonText="Upload meeting video"
                                    title="Upload your election video recording."
                                    subtitle=""
                                    action="electvideo"
                                    uploadCompleteMessage={
                                        uploadCompleteMessage.roundIndex ===
                                        vote.roundIndex
                                            ? uploadCompleteMessage.message
                                            : undefined
                                    }
                                />
                            </Container>
                        </Expander>
                    </div>
                );
            })}
        </>
    );
};

const LoaderSection = () => (
    <Container>
        <Loader />
    </Container>
);

interface HeaderProps {
    isOngoing: boolean;
    roundIndex: number;
    winner?: MemberAccountData;
    roundStartTime?: dayjs.Dayjs;
    roundEndTime?: dayjs.Dayjs;
}

const Header = ({
    isOngoing,
    roundIndex,
    winner,
    roundStartTime,
    roundEndTime,
}: HeaderProps) => {
    const subText =
        winner && isValidDelegate(winner.account)
            ? `Delegate: ${winner.name}`
            : roundStartTime && roundEndTime
            ? `${roundStartTime.format("LT")} - ${roundEndTime.format("LT z")}`
            : "Consensus not achieved";

    return (
        <RoundHeader
            isRoundActive={isOngoing}
            headlineComponent={
                <Text size="sm" className="font-semibold">
                    Round {roundIndex + 1} {!isOngoing && "completed"}
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
