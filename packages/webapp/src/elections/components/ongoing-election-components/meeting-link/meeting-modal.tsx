import { useEffect, useState } from "react";

import { Button, Heading, Modal, Text } from "_app/ui";
import { zoomConnectAccountLink } from "_api/zoom-commons";
import { RoundStage } from "elections/interfaces";
import {
    useEncryptionPassword,
    ReenterPasswordPrompt,
    CreateNewPasswordPrompt,
} from "encryption";

import { MeetingStep } from "./meeting-link";

interface ModalProps {
    isOpen: boolean;
    close: () => void;
    meetingStep: MeetingStep;
    requestMeetingLink: (throwOnError: boolean) => Promise<void>;
    stage: RoundStage;
}

export const MeetingLinkModal = ({
    isOpen,
    close,
    meetingStep,
    requestMeetingLink,
    stage,
}: ModalProps) => {
    const { encryptionPassword, isLoading } = useEncryptionPassword();
    const { publicKey, privateKey } = encryptionPassword;

    const [isCreatingMeetingLink, setIsCreatingMeetingLink] = useState(false);
    const [isReenteringPassword, setIsReenteringPassword] = useState(false);
    const [isCreatingPassword, setIsCreatingPassword] = useState(false);
    const isPasswordMissing = Boolean(!isLoading && publicKey && !privateKey);
    const isPasswordNotSet = !isLoading && !publicKey;

    const linkAlreadyExists = meetingStep === MeetingStep.RetrieveMeetingLink;

    useEffect(() => {
        if (isCreatingPassword || isReenteringPassword) {
            return;
        }
        if (isPasswordMissing && isOpen) {
            setIsReenteringPassword(true);
        }
        if (isPasswordNotSet && isOpen) {
            setIsCreatingPassword(true);
        }
    }, [isPasswordMissing, isPasswordNotSet, isOpen]);

    const resetModalState = () => {
        setIsReenteringPassword(false);
        setIsCreatingPassword(false);
        setIsCreatingMeetingLink(false);
    };

    const cancel = () => {
        resetModalState();
        close();
    };

    const dismissPasswordConfirmation = () => {
        resetModalState();
        linkAlreadyExists && close();
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={close}
            onAfterClose={resetModalState}
            contentLabel="Election round meeting link confirmation modal"
            preventScroll
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
        >
            {isCreatingPassword || isReenteringPassword ? (
                <ModalStepPassword
                    close={cancel}
                    dismissOnSuccess={dismissPasswordConfirmation}
                    isReenteringPassword={isReenteringPassword}
                    isCreatingPassword={isCreatingPassword}
                    linkAlreadyExists={linkAlreadyExists}
                />
            ) : meetingStep === MeetingStep.LinkZoomAccount ? (
                <ModalStepZoom close={close} />
            ) : meetingStep === MeetingStep.CreateMeetingLink ||
              isCreatingMeetingLink ? (
                <ModalStepGetLink
                    close={close}
                    onBeforeRequestMeetingLink={() =>
                        setIsCreatingMeetingLink(true)
                    } // keep this step active when it updates to RetrieveMeetingLink once link is present
                    requestMeetingLink={requestMeetingLink}
                    stage={stage}
                />
            ) : null}
        </Modal>
    );
};

interface ModalStepProps {
    close: () => void;
}

interface ModalStepPasswordProps extends ModalStepProps {
    dismissOnSuccess: () => void;
    isReenteringPassword: boolean;
    isCreatingPassword: boolean;
    linkAlreadyExists: boolean;
}

const ModalStepPassword = ({
    close,
    dismissOnSuccess,
    isReenteringPassword,
    isCreatingPassword,
    linkAlreadyExists,
}: ModalStepPasswordProps) => {
    if (isCreatingPassword) {
        return (
            <CreateNewPasswordPrompt
                onCancel={close}
                onDismissConfirmation={dismissOnSuccess}
                isTooLateForCurrentRound={linkAlreadyExists}
            />
        );
    }

    if (isReenteringPassword) {
        return (
            <ReenterPasswordPrompt
                onCancel={close}
                onDismissConfirmation={dismissOnSuccess}
                isTooLateForCurrentRound={linkAlreadyExists}
            />
        );
    }

    return null;
};

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
    onBeforeRequestMeetingLink: () => void;
}

const ModalStepGetLink = ({
    close,
    requestMeetingLink,
    stage,
    onBeforeRequestMeetingLink,
}: ModalStepGetLinkProps) => {
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const onContinue = async () => {
        setIsLoading(true);
        onBeforeRequestMeetingLink();
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

export default MeetingLinkModal;
