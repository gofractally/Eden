import React, { useEffect, useState } from "react";
import { RiVideoUploadLine } from "react-icons/ri";
import dayjs from "dayjs";

import {
    SideNavLayout,
    isValidDelegate,
    onError,
    uploadIpfsFileWithTransaction,
    uploadToIpfs,
    useCommunityGlobals,
    useCurrentElection,
    useLocalStorage,
    useOngoingElectionData,
    useUALAccount,
    useElectionState,
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
    getRoundTimes,
} from "elections";
import { EdenMember } from "members";
import { RoundHeader } from "elections/components/ongoing-election-components";

export const RoundVideoUploadPage = () => {
    const [isElectionComplete, setIsElectionComplete] = useState(false);
    const [uploadLimitTime, setUploadLimitTime] = useState(dayjs());

    const {
        data: currentElection,
        isLoading: isLoadingElection,
        isError: isErrorElection,
    } = useCurrentElection();
    const { data: electionState } = useElectionState();

    useEffect(() => {
        if (electionState) {
            const newUploadLimitTime = dayjs(
                electionState.last_election_time + "Z"
            ).add(48, "hour");
            setUploadLimitTime(newUploadLimitTime);
        }
    }, [electionState]);

    useEffect(() => {
        const isAfterUploadLimitTime = dayjs().isAfter(uploadLimitTime);
        if (
            isAfterUploadLimitTime &&
            currentElection?.electionState === ElectionStatus.Registration
        ) {
            setIsElectionComplete(true);
        }
    }, [currentElection, uploadLimitTime]);

    const isLoading = isLoadingElection;
    const isError = isErrorElection;

    if (isLoading || !currentElection) return <LoaderSection />;
    if (isError) return <ErrorLoadingElection />;

    return (
        <SideNavLayout title="Election video upload service">
            <div className="divide-y">
                <Container>
                    <Heading size={1}>Election video upload service</Heading>
                </Container>
                <Container className="space-y-6 pb-5">
                    {isElectionComplete ? (
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
                {!isElectionComplete && (
                    <RoundVideoUploadList election={currentElection} />
                )}
            </div>
        </SideNavLayout>
    );
};

export default RoundVideoUploadPage;

const RoundVideoUploadList = ({ election }: { election: CurrentElection }) => {
    const [ualAccount] = useUALAccount();
    const {
        data: communityGlobals,
        isLoading: isLoadingGlobals,
        isError: isErrorGlobals,
    } = useCommunityGlobals();
    const {
        data: currentElection,
        isLoading: isLoadingElection,
        isError: isErrorElection,
    } = useCurrentElection();
    const {
        data: ongoingElectionData,
        isLoading: isLoadingOngoingElectionData,
        isError: isErrorOngoingElectionData,
    } = useOngoingElectionData({
        currentElection: election,
    });
    const [roundVideoList, setRoundVideoList] = useLocalStorage(
        "RoundVideosUploaded",
        {}
    );
    const [videoSubmissionPhase, setVideoSubmissionPhase] = useState<
        VideoSubmissionPhase | undefined
    >(undefined);
    const [uploadCompleteMessage, setUploadCompleteMessage] = useState("");

    const isLoading =
        isLoadingGlobals || isLoadingElection || isLoadingOngoingElectionData;
    const isError =
        isErrorGlobals || isErrorElection || isErrorOngoingElectionData;

    if (isLoading) {
        return <LoaderSection />;
    } else if (isError) {
        return <ErrorLoadingElection />;
    }

    if (
        !ongoingElectionData ||
        (ongoingElectionData.completedRounds.length === 0 &&
            ongoingElectionData.ongoingRound.participantsMemberData.length ===
                0)
    )
        return (
            <Text className="p-8">
                It appears you haven't participated in any election round.
                Nothing to upload.
            </Text>
        );

    const { roundEndTime, roundStartTime } = getRoundTimes(
        communityGlobals,
        currentElection
    );
    const numCompletedRounds: number =
        ongoingElectionData.completedRounds.length;

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

            roundVideoList[roundIndex] = videoHash;
            setRoundVideoList(roundVideoList);

            setVideoSubmissionPhase(undefined);
            setUploadCompleteMessage("Election video uploaded successfully!");
        } catch (error) {
            onError(error, "Unable to set the election round video");
            setVideoSubmissionPhase(undefined);
        }
    };

    const roundIndex = ongoingElectionData.ongoingRound.roundIndex;

    return (
        <>
            {[...Array(numCompletedRounds)].map((_, roundIndex) => {
                const commonDelegate =
                    ongoingElectionData.completedRounds[roundIndex].delegate;
                return (
                    <div key={`video-round-${roundIndex}`}>
                        <Expander
                            header={
                                <Header
                                    isOngoing={false}
                                    roundIndex={roundIndex}
                                    winner={commonDelegate}
                                />
                            }
                            startExpanded
                            darkBg={true}
                        >
                            <Container>
                                <VideoSubmissionFormAndPreview
                                    uid={roundIndex}
                                    video={roundVideoList[roundIndex]}
                                    onSubmit={submitElectionRoundVideo(
                                        roundIndex
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
                                        uploadCompleteMessage
                                    }
                                />
                            </Container>
                        </Expander>
                    </div>
                );
            })}
            {
                /* Ongoing Round */
                roundIndex !== undefined &&
                    Number.isInteger(roundIndex) &&
                    ongoingElectionData.ongoingRound.participantsMemberData?.find(
                        (m) => m.account === ualAccount.accountName
                    ) && (
                        <Expander
                            header={
                                <Header
                                    isOngoing
                                    roundIndex={roundIndex}
                                    roundStartTime={roundStartTime}
                                    roundEndTime={roundEndTime}
                                />
                            }
                            darkBg={false}
                        >
                            <Container>
                                <VideoSubmissionFormAndPreview
                                    uid={roundIndex}
                                    video={roundVideoList[roundIndex]}
                                    onSubmit={submitElectionRoundVideo(
                                        roundIndex
                                    )}
                                    submissionPhase={videoSubmissionPhase}
                                    submitButtonText="Upload meeting video"
                                    submitButtonIcon={
                                        <RiVideoUploadLine
                                            size={18}
                                            className="mr-2"
                                        />
                                    }
                                    title={`Round ${roundIndex + 1} Video`}
                                    subtitle={`As a participant in the election, upload the video of Round ${
                                        roundIndex + 1
                                    } here.`}
                                    action="electvideo"
                                    uploadCompleteMessage={
                                        uploadCompleteMessage
                                    }
                                />
                            </Container>
                        </Expander>
                    )
            }
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
    winner?: EdenMember;
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
        roundStartTime && roundEndTime
            ? `${roundStartTime.format("LT")} - ${roundEndTime.format("LT z")}`
            : winner && isValidDelegate(winner.account)
            ? `Delegate elect: ${winner.name}`
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
