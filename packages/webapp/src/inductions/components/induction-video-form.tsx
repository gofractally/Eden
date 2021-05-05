import React, { FormEvent, useState } from "react";

import { ActionButton, Form } from "_app";

interface Props {
    video: string;
    onSubmit?: (videoHash: string) => Promise<void>;
}

export const InductionVideoForm = ({ video, onSubmit }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [videoHash, setVideoHash] = useState(video);

    const submitTransaction = async (e: FormEvent) => {
        e.preventDefault();
        if (!onSubmit) return;
        setIsLoading(true);
        await onSubmit(videoHash);
        setIsLoading(false);
    };

    return (
        <form onSubmit={submitTransaction} className="space-y-3">
            <Form.LabeledSet
                label="Induction video (IPFS CID hash)"
                htmlFor="name"
                description="As an official witness and endorser, you need to upload the video of the induction ceremony to IPFS and paste the IPFS CID hash here."
            >
                <Form.Input
                    id="name"
                    type="text"
                    required
                    disabled={isLoading}
                    value={videoHash}
                    onChange={(e) => setVideoHash(e.currentTarget.value)}
                />
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
