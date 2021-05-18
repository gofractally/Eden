import { ipfsBaseUrl } from "config";
import React, { FormEvent, useEffect, useRef, useState } from "react";

import { ActionButton, Form, handleFileChange, onError } from "_app";

interface Props {
    video: string;
    onSubmit?: (video: File) => Promise<void>;
}

export const InductionVideoForm = ({ video, onSubmit }: Props) => {
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

    const getVideoUrl = () => {
        if (uploadedVideo) {
            return URL.createObjectURL(uploadedVideo);
        } else {
            return `${ipfsBaseUrl}/${video}`;
        }
    };

    return (
        <form onSubmit={submitTransaction} className="space-y-3">
            <Form.LabeledSet
                label="Induction video"
                htmlFor="videoFile"
                description="As an official witness and endorser, you need to upload the video of the induction ceremony to IPFS and paste the IPFS CID hash here."
            >
                <Form.FileInput
                    id="videoFile"
                    accept="video/*"
                    label="select a video file"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFileChange(e, "video", setUploadedVideo)
                    }
                />
                {(video || uploadedVideo) && <VideoClip url={getVideoUrl()} />}
            </Form.LabeledSet>

            {onSubmit && (
                <div className="pt-4">
                    <ActionButton isSubmit disabled={isLoading}>
                        {isLoading ? "Submitting..." : "Submit"}
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
        <video ref={videoRef} controls>
            <source src={url} />
        </video>
    );
};
