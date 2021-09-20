import { Dispatch, SetStateAction, useState } from "react";
import { useQueryClient } from "react-query";

import {
    Heading,
    onError,
    queryInductionWithEndorsements,
    Text,
    uploadIpfsFileWithTransaction,
    uploadToIpfs,
    useUALAccount,
} from "_app";
import { InductionNames } from "inductions";

import { Induction } from "../../../interfaces";
import { getInductionRemainingTimeDays } from "../../../utils";
import { setInductionVideoTransaction } from "../../../transactions";
import { InductionVideoForm, VideoSubmissionPhase } from "./video-form";

interface Props {
    induction: Induction;
    isRevisitingVideo: boolean;
    setSubmittedVideo: Dispatch<SetStateAction<boolean>>;
}

export const InductionVideoFormContainer = ({
    induction,
    isRevisitingVideo,
    setSubmittedVideo,
}: Props) => {
    const [ualAccount] = useUALAccount();
    const queryClient = useQueryClient();
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
                expireSeconds: 1200,
            });
            console.info("inductvideo trx", signedTrx);

            setVideoSubmissionPhase("finishing");
            await uploadIpfsFileWithTransaction(
                signedTrx,
                videoHash,
                videoFile
            );

            queryClient.invalidateQueries(
                queryInductionWithEndorsements(induction.id).queryKey
            );

            setSubmittedVideo(true);
        } catch (error) {
            onError(error as Error, "Unable to set the induction video");
            setVideoSubmissionPhase(undefined);
        }
    };

    return (
        <>
            <Heading size={1} className="mb-2">
                {isRevisitingVideo
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
                <InductionNames inductionId={induction.id} />
            </div>
            <InductionVideoForm
                video={induction.video}
                onSubmit={submitInductionVideo}
                submissionPhase={videoSubmissionPhase}
            />
        </>
    );
};
