import React, { Dispatch, SetStateAction, useState } from "react";
import {
    Heading,
    onError,
    Text,
    uploadIpfsFileWithTransaction,
    uploadToIpfs,
    useUALAccount,
} from "_app";
import {
    getInductionRemainingTimeDays,
    setInductionVideoTransaction,
} from "inductions";
import { Induction } from "inductions/interfaces";
import { VideoSubmissionPhase, InductionVideoForm } from ".";

interface Props {
    induction: Induction;
    isReviewingVideo: boolean;
    setSubmittedVideo: Dispatch<SetStateAction<boolean>>;
}

export const InductionVideoFormContainer = ({
    induction,
    isReviewingVideo,
    setSubmittedVideo,
}: Props) => {
    const [ualAccount] = useUALAccount();
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
            setVideoSubmissionPhase(undefined);
        }
    };

    return (
        <>
            <Heading size={1} className="mb-2">
                {isReviewingVideo
                    ? "Review induction video"
                    : "Induction ceremony"}
            </Heading>
            <Text className="mb-8">
                This invitation expires in{" "}
                {getInductionRemainingTimeDays(induction)}.
            </Text>
            <div className="space-y-3 mb-8">
                <Text className="leading-normal">
                    It's time for the induction ceremony! The inviter, witnesses
                    and prospective Eden member will record a short, scripted
                    video conference call inducting the new member.
                </Text>
            </div>
            <InductionVideoForm
                video={induction.video}
                onSubmit={submitInductionVideo}
                submissionPhase={videoSubmissionPhase}
            />
        </>
    );
};
