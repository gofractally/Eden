import { FormEvent, useState } from "react";

import { Button, Form } from "_app";

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
                label="Induction Video (IPFS Hash)"
                htmlFor="name"
                description="You, as an official endorser, need to upload the video of the induction ceremony to an IPFS node and paste the IPFS Hash here."
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
                <div className="w-max mx-auto">
                    <Button isSubmit disabled={isLoading}>
                        {isLoading ? "Submitting..." : "Submit"}
                    </Button>
                </div>
            )}
        </form>
    );
};
