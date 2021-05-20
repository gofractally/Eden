import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { ActionButton, Form, handleFileChange } from "_app";
import { ipfsUrl } from "_app/utils/config-helpers";
import { edenContractAccount, validUploadActions } from "config";

export type VideoSubmissionPhase = "uploading" | "signing" | "finishing";
interface Props {
    video: string;
    onSubmit?: (video: File) => Promise<void>;
    submissionPhase?: VideoSubmissionPhase;
}

export const InductionVideoForm = ({
    video,
    onSubmit,
    submissionPhase,
}: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedVideo, setUploadedVideo] = useState<File | undefined>(
        undefined
    );

    const [resettingVideo, setResetVideo] = useState(false);

    useEffect(() => {
        setResetVideo(true);
    }, [uploadedVideo]);

    useEffect(() => {
        setResetVideo(false);
    }, [resettingVideo]);

    const submitTransaction = async (e: FormEvent) => {
        e.preventDefault();
        if (!onSubmit || !uploadedVideo) return;
        setIsLoading(true);
        await onSubmit(uploadedVideo);
        setIsLoading(false);
    };

    const videoUrl = useMemo(() => {
        if (uploadedVideo) {
            return URL.createObjectURL(uploadedVideo);
        } else {
            return ipfsUrl(video);
        }
    }, [uploadedVideo, video]);

    const getSubmissionText = () => {
        switch (submissionPhase) {
            case "uploading":
                return "Uploading video...";
            case "signing":
                return "Waiting for you to sign...";
            case "finishing":
                return "Finishing up...";
            default:
                return "Submit";
        }
    };

    return (
        <form onSubmit={submitTransaction} className="space-y-3">
            <Form.LabeledSet
                label="Induction video"
                htmlFor="videoFile"
                description="As an official witness, upload the video of the induction ceremony here."
            >
                <Form.FileInput
                    id="videoFile"
                    accept="video/*"
                    label="select a video file"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFileChange(
                            e,
                            "video",
                            validUploadActions[edenContractAccount][
                                "inductvideo"
                            ].maxSize,
                            setUploadedVideo
                        )
                    }
                />
                {(video || uploadedVideo) && <VideoClip url={videoUrl} />}
            </Form.LabeledSet>

            {onSubmit && (
                <div className="pt-4">
                    <ActionButton
                        isSubmit
                        disabled={isLoading || !uploadedVideo}
                        isLoading={isLoading}
                    >
                        {getSubmissionText()}
                    </ActionButton>
                </div>
            )}
        </form>
    );
};

const VideoClip = ({ url }: { url: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const previousUrl = useRef(url);

    useEffect(() => {
        if (previousUrl.current === url) {
            return;
        }

        if (videoRef.current) {
            videoRef.current.load();
        }

        previousUrl.current = url;
    }, [url]);

    return (
        <video key={url} ref={videoRef} controls>
            <source src={url} />
        </video>
    );
};
