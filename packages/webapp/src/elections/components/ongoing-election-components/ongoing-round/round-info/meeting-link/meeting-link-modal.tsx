import React, { useState } from "react";

import { Button, Form, Heading, Modal, Text } from "_app/ui";
import { zoomConnectAccountLink } from "_api/zoom-commons";
import { RoundStage } from "elections/interfaces";

import { MeetingStep } from "./meeting-link";
import { election as electionConfig } from "config";
import { onError, useFormFields } from "_app";

interface Props {
    isOpen: boolean;
    close: () => void;
    meetingStep: MeetingStep;
    requestMeetingLink: () => Promise<void>;
    submitMeetingLink: (meetingLink: string) => Promise<void>;
    stage: RoundStage;
}

export const MeetingLinkModal = ({
    isOpen,
    close,
    meetingStep,
    requestMeetingLink,
    submitMeetingLink,
    stage,
}: Props) => (
    <Modal
        isOpen={isOpen}
        onRequestClose={close}
        contentLabel="Election round meeting link confirmation modal"
        preventScroll
        shouldCloseOnOverlayClick={false}
        shouldCloseOnEsc={false}
    >
        {meetingStep === MeetingStep.LinkZoomAccount ? (
            <ModalStepZoom close={close} />
        ) : (
            <ModalStepGetLink
                close={close}
                requestMeetingLink={requestMeetingLink}
                submitMeetingLink={submitMeetingLink}
                stage={stage}
            />
        )}
    </Modal>
);

interface ModalStepProps {
    close: () => void;
}

const ModalStepZoom = ({ close }: ModalStepProps) => {
    const linkZoomAccount = () => {
        window.location.href =
            zoomConnectAccountLink + "&state=request-election-link";
    };

    return (
        <div className="space-y-4">
            <Heading>Create meeting link</Heading>
            <Text>
                Sign in with your Zoom account to create a meeting link for
                participants in this round. After you sign in, you will be
                redirected back to the ongoing election.
            </Text>
            <div className="flex space-x-3">
                <Button type="neutral" onClick={close}>
                    Cancel
                </Button>
                <Button onClick={linkZoomAccount}>Link Zoom account</Button>
            </div>
        </div>
    );
};

interface ModalStepGetLinkProps extends ModalStepProps {
    requestMeetingLink: () => Promise<void>;
    submitMeetingLink: (meetingLink: string) => Promise<void>;
    stage: RoundStage;
}

const ModalStepGetLink = ({
    close,
    requestMeetingLink,
    submitMeetingLink,
    stage,
}: ModalStepGetLinkProps) => {
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fields, setFields] = useFormFields({
        meetingLink: "",
    });

    const onContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (electionConfig.freeformMeetingLinksEnabled) {
                await submitMeetingLink(fields.meetingLink);
            } else {
                await requestMeetingLink();
            }
            setIsSuccess(true);
        } catch (error) {
            console.error(error);
            onError(error as Error);
            setIsSuccess(false);
        }
        setIsLoading(false);
    };

    if (isSuccess) {
        return (
            <div className="space-y-4">
                <Heading>Success!</Heading>
                <Text>A meeting link has been created for your group.</Text>
                {stage === RoundStage.PreMeeting ? (
                    <Text>
                        As soon as your round begins, a "Join meeting" button
                        will appear on the election screen.
                    </Text>
                ) : (
                    <Text>
                        Dismiss this message and look for the "Join meeting"
                        button on the election screen.
                    </Text>
                )}
                <div className="flex space-x-3">
                    <Button onClick={close}>Ok</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Heading>Create meeting link</Heading>
            <Text>
                Let's create a meeting link for your group to use during this
                round!
            </Text>
            <Text>
                In the next step, you may be asked to sign a transaction setting
                the meeting link up.
            </Text>
            <form onSubmit={onContinue}>
                {electionConfig.freeformMeetingLinksEnabled && (
                    <div className="space-y-3 mb-3">
                        <Text>
                            Use Zoom to generate a password-protected meeting
                            link and paste the meeting link (with the password
                            appended to the end) here. E.g.,{" "}
                            <code className="text-xs bg-gray-200 text-red-500 p-1">
                                https://us06web.zoom.us/j/71043116043?pwd=RZFqdZ1TUFBzSVREzFRPS
                            </code>
                            .
                        </Text>
                        <Form.LabeledSet
                            label="Meeting Link"
                            htmlFor="meetingLink"
                            className="col-span-6 sm:col-span-3"
                        >
                            <Form.Input
                                id="meetingLink"
                                type="text"
                                required
                                value={fields.meetingLink}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                ) => setFields(e)}
                            />
                        </Form.LabeledSet>
                    </div>
                )}
                <div className="flex space-x-3">
                    <Button type="neutral" onClick={close}>
                        Cancel
                    </Button>
                    <Button isSubmit isLoading={isLoading} disabled={isLoading}>
                        Continue
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default MeetingLinkModal;
