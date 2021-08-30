import { useState } from "react";

import { Button, Heading, Modal, Text } from "_app/ui";
import { zoomConnectAccountLink } from "_api/zoom-commons";
import { RoundStage } from "elections/interfaces";

import { MeetingStep } from "./meeting-link";

interface Props {
    isOpen: boolean;
    close: () => void;
    meetingStep: MeetingStep;
    requestMeetingLink: (throwOnError: boolean) => Promise<void>;
    stage: RoundStage;
}

export const MeetingModal = ({
    isOpen,
    close,
    meetingStep,
    requestMeetingLink,
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
    requestMeetingLink: (throwOnError: boolean) => Promise<void>;
    stage: RoundStage;
}

const ModalStepGetLink = ({
    close,
    requestMeetingLink,
    stage,
}: ModalStepGetLinkProps) => {
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const onContinue = async () => {
        setIsLoading(true);
        try {
            await requestMeetingLink(true);
            setIsSuccess(true);
        } catch (error) {
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
            <div className="flex space-x-3">
                <Button type="neutral" onClick={close}>
                    Cancel
                </Button>
                <Button
                    onClick={onContinue}
                    isLoading={isLoading}
                    disabled={isLoading}
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};

export default MeetingModal;
