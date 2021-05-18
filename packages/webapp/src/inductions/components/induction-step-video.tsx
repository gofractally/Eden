import React, { useState } from "react";

import {
    ActionButton,
    ActionButtonSize,
    Heading,
    onError,
    Text,
    uploadIpfsFileWithTransaction,
    uploadToIpfs,
    useUALAccount,
} from "_app";
import {
    convertPendingProfileToMemberData,
    getInductionRemainingTimeDays,
} from "../utils";
import { Induction } from "../interfaces";
import { setInductionVideoTransaction } from "../transactions";
import {
    InductionVideoForm,
    VideoSubmissionPhase,
} from "./induction-video-form";
import {
    InductionJourneyContainer,
    InductionRole,
    MemberCardPreview,
} from "inductions";

interface Props {
    induction: Induction;
    isEndorser: boolean;
    isReviewing?: boolean;
}

export const InductionStepVideo = ({
    induction,
    isEndorser,
    isReviewing,
}: Props) => {
    const [ualAccount] = useUALAccount();
    const [submittedVideo, setSubmittedVideo] = useState(false);
    const [videoSubmissionPhase, setVideoSubmissionPhase] = useState<
        VideoSubmissionPhase | undefined
    >(undefined);

    const submitInductionVideo = async (videoFile: File) => {
        try {
            setVideoSubmissionPhase("uploading");
            const videoHash = await uploadToIpfs(videoFile);

            const authorizerAccount = ualAccount.accountName;
            const transaction = setInductionVideoTransaction(
                authorizerAccount,
                induction.id,
                videoHash
            );
            console.info(transaction);
            setVideoSubmissionPhase("signing");
            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: false,
            });
            console.info("inductvideo trx", signedTrx);

            setVideoSubmissionPhase("finishing");
            await uploadIpfsFileWithTransaction(signedTrx, videoHash);

            setSubmittedVideo(true);
        } catch (error) {
            onError(error, "Unable to set the induction video");
        }
    };

    const memberData = convertPendingProfileToMemberData(induction);

    // Invitee/Endorser: Induction ceremony completion confirmation
    if (submittedVideo) {
        return (
            <>
                <VideoSubmitConfirmation />
                <MemberCardPreview memberData={memberData} />
            </>
        );
    }

    // Invitee/Endorser: Waiting for induction ceremony
    if (isEndorser) {
        return (
            <>
                <AddUpdateVideoHash
                    induction={induction}
                    onSubmit={submitInductionVideo}
                    isReviewing={isReviewing}
                    submissionPhase={videoSubmissionPhase}
                />
                <MemberCardPreview memberData={memberData} />
            </>
        );
    }

    // Invitee: Waiting for induction ceremony
    return (
        <>
            <WaitingForInductionCeremony induction={induction} />
            <MemberCardPreview memberData={memberData} />
        </>
    );
};

const VideoSubmitConfirmation = () => (
    <InductionJourneyContainer role={InductionRole.INVITER} step={3}>
        <Heading size={1} className="mb-5">
            Received!
        </Heading>
        <div className="space-y-3 mb-8">
            <Text className="leading-normal">
                You attached the induction video.
            </Text>
            <Text className="leading-normal">
                It's time for all witnesses (including the inviter) to endorse
                the prospective member. Now's a good time to reach out to the
                other witnesses to let them know that the invitee is waiting for
                their endorsement.
            </Text>
        </div>
        <ActionButton
            onClick={() => window.location.reload()}
            size={ActionButtonSize.L}
        >
            Onward!
        </ActionButton>
    </InductionJourneyContainer>
);

interface AddUpdateVideoHashProps {
    induction: Induction;
    onSubmit?: (videoFile: File) => Promise<void>;
    isReviewing?: boolean;
    submissionPhase?: VideoSubmissionPhase;
}

const AddUpdateVideoHash = ({
    induction,
    onSubmit,
    isReviewing,
    submissionPhase,
}: AddUpdateVideoHashProps) => (
    <InductionJourneyContainer role={InductionRole.INVITER} step={3}>
        <Heading size={1} className="mb-2">
            {isReviewing ? "Review induction video" : "Induction ceremony"}
        </Heading>
        <Text className="mb-8">
            This invitation expires in{" "}
            {getInductionRemainingTimeDays(induction)}.
        </Text>
        <div className="space-y-3 mb-8">
            <Text className="leading-normal">
                It's time for the induction ceremony! The inviter, witnesses and
                prospective Eden member will record a short, scripted video
                conference call inducting the new member.
            </Text>
            <Text className="leading-normal">
                Once complete, upload the recording to IPFS and submit the IPFS
                CID hash below.
            </Text>
        </div>
        <InductionVideoForm
            video={induction.video}
            onSubmit={onSubmit}
            submissionPhase={submissionPhase}
        />
    </InductionJourneyContainer>
);

const WaitingForInductionCeremony = ({
    induction,
}: {
    induction: Induction;
}) => (
    <InductionJourneyContainer role={InductionRole.INVITEE} step={3}>
        <Heading size={1} className="mb-5">
            Pending induction ceremony
        </Heading>
        <div className="space-y-3 mb-8">
            <Text className="leading-normal">
                Your inviter or one of the witnesses will be in touch with you
                to schedule a short, recorded video induction ceremony.
            </Text>
            <Text className="leading-normal">
                If you've already completed the ceremony, ask your inviter or a
                witness to attach the video recording here.
            </Text>
            <Text className="leading-normal">
                <span className="font-medium">
                    Remember, this invitation is still open and expires in{" "}
                    {getInductionRemainingTimeDays(induction)}.
                </span>{" "}
                If time runs out, you can always request another invitation.
            </Text>
            <Text className="leading-normal">
                In the meantime, review your Eden profile below.
            </Text>
        </div>
    </InductionJourneyContainer>
);
