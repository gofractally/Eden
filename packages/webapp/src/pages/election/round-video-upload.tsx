import React, { useEffect, useState } from "react";
import { RiVideoUploadLine } from "react-icons/ri";
import { Dayjs } from "dayjs";

import {
    FluidLayout,
    isValidDelegate,
    onError,
    uploadIpfsFileWithTransaction,
    uploadToIpfs,
    useCommunityGlobals,
    useCurrentElection,
    useCurrentMember,
    useLocalStorage,
    useOngoingElectionData,
    useUALAccount,
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
    Election,
    ElectionStatus,
    ErrorLoadingElection,
    getRoundTimes,
    setElectionRoundVideo,
} from "elections";
import { EncryptionPasswordAlert } from "encryption";
import { EdenMember } from "members";
import { RoundHeader } from "elections/components/ongoing-election-components";

export const RoundVideoUploadPage = () => {
    const [isElectionComplete, setIsElectionComplete] = useState(false);
    const {
        data: currentMember,
        isLoading: isLoadingMember,
        isError: isErrorMember,
    } = useCurrentMember();
    const {
        data: currentElection,
        isLoading: isLoadingElection,
        isError: isErrorElection,
    } = useCurrentElection();

    useEffect(() => {
        if (currentElection?.electionState === ElectionStatus.Registration) {
            setIsElectionComplete(true);
        }
    }, [currentElection]);

    const isLoading = isLoadingMember || isLoadingElection;
    const isError = isErrorMember || isErrorElection;

    if (isError) return <ErrorLoadingElection />;
    if (!currentElection) return <div>No currentElection yet</div>;

    const renderBanner = true; // TODO: get end time for video submission

    // TODO:
    // x) Add container to contents
    // x) Add ongoing round
    // x) Color completed round gray
    // x) Add local storage persistence
    // O) Test refetching of ongoingElectionData to update how many round show (as rounds complete and start)
    // O) True up to UX -- Brandon: how to set border-t-0 on explanatory text at top of video upload page
    // 7) handling loading/error conditions nicely
    // x) Verify logged-in user is member and was in each round (otherwise don't display that round)
    // 9) No reason to show ongoing round until voting is possible (avoid the "starts in..." period)
    // x) Consider where components and files are (check imports) and rearrange them to be logical

    return (
        <FluidLayout
            title="Election-video upload service"
            banner={
                renderBanner && (
                    <EncryptionPasswordAlert
                        promptSetupEncryptionKey={
                            currentElection?.electionState !==
                            ElectionStatus.Registration
                        }
                    />
                )
            }
        >
            {isLoading || isElectionComplete ? (
                <LoaderSection />
            ) : (
                <div className="divide-y">
                    <Container>
                        <Heading size={1}>
                            Election-video upload service
                        </Heading>
                    </Container>
                    <Container className="space-y-6 pb-5">
                        <Text>
                            Election video files are typically large and require
                            many mintes to pload completely. Do mot close this
                            tab during the upload. A confirmatio wil be
                            displayed when your upload is complete, along with a
                            preview of your video.
                        </Text>
                        <Text>
                            Be patient, and remember you have up to 48 hours
                            from the beginning of the electin to complete your
                            election video uploads.
                        </Text>
                    </Container>
                    <RoundVideoUploadList election={currentElection} />
                </div>
            )}
        </FluidLayout>
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
    }: { data?: Election } = useOngoingElectionData({
        currentElection: election,
    });
    console.info("useOngoingElectionData() return:", ongoingElectionData);
    const [roundVideoList, setRoundVideoList] = useLocalStorage(
        "RoundVideosUploaded",
        {}
    );
    const [videoSubmissionPhase, setVideoSubmissionPhase] = useState<
        VideoSubmissionPhase | undefined
    >(undefined);

    if (!ongoingElectionData) return <div>Loading data</div>;

    const numCompletedRounds: number =
        ongoingElectionData.completedRounds.length;

    const submitElectionRoundVideo = (roundIndex: number) => async (
        videoFile: File
    ) => {
        try {
            setVideoSubmissionPhase("uploading");
            const videoHash = await uploadToIpfs(videoFile);
            // console.info(`submitElectionRoundVideo().videoHash[${videoHash}]`);

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
            // console.info(`set video[${roundIndex}]:`, videoHash);
            setRoundVideoList(roundVideoList);

            setVideoSubmissionPhase(undefined);
        } catch (error) {
            onError(error, "Unable to set the election round video");
            setVideoSubmissionPhase(undefined);
        }
    };

    const { roundEndTime, roundStartTime } = getRoundTimes(
        communityGlobals,
        currentElection
    );
    const roundIndex = ongoingElectionData.ongoingRound.roundIndex;
    if (
        !ongoingElectionData.completedRounds[0]?.participants?.find(
            (m) => m.account === ualAccount.accountName
        )
    )
        return (
            <Text className="p-8">
                It appears you haven't participated in any election round.
                Nothing to upload.
            </Text>
        );
    return (
        <>
            {[...Array(numCompletedRounds)].map((_, roundIndex) => {
                if (
                    !ongoingElectionData.completedRounds[
                        roundIndex
                    ]?.participants?.find(
                        (m) => m.account === ualAccount.accountName
                    )
                )
                    return null;
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
                                    title="Upload your election video recording."
                                    // subtitle={`As a participant in the election, upload the video of Round ${
                                    //     roundIndex + 1
                                    // } here.`}
                                    subtitle=""
                                    action="electvideo"
                                />
                            </Container>
                        </Expander>
                    </div>
                );
            })}
            {
                /* Ongoing Round */
                roundIndex &&
                    Number.isInteger(roundIndex) &&
                    ongoingElectionData.ongoingRound.participantsMemberData?.find(
                        (m) => m.account === ualAccount.accountName
                    ) && (
                        <Expander
                            header={
                                <Header
                                    isOngoing={true}
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
    roundStartTime?: Dayjs;
    roundEndTime?: Dayjs;
}

const Header = ({
    isOngoing,
    roundIndex,
    winner,
    roundStartTime,
    roundEndTime,
}: HeaderProps) => {
    console.info("<Header/>.winner:", winner);
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
