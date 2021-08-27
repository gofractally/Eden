import { useEffect, useState } from "react";
import { BiWebcam } from "react-icons/bi";
import { Dayjs } from "dayjs";
import { BsExclamationTriangle } from "react-icons/bs";

import {
    decryptPublishedMessage,
    delay,
    encryptSecretForPublishing,
    onError,
    useEncryptedData,
    useMemberGroupParticipants,
    useUALAccount,
    useVoteDataRow,
    useZoomAccountJWT,
} from "_app";
import { Button, Heading, Modal, Text } from "_app/ui";
import {
    generateZoomMeetingLink,
    zoomConnectAccountLink,
} from "_api/zoom-commons";
import { setElectionMeeting } from "elections/transactions";
import { calculateGroupId } from "elections/utils";
import { ActiveStateConfigType, RoundStage } from "elections/interfaces";
import {
    EncryptedData,
    getEncryptionKey,
    useEncryptionPassword,
    ReenterPasswordPrompt,
    CreateNewPasswordPrompt,
} from "encryption";

enum MeetingStep {
    LinkZoomAccount,
    CreateMeetingLink,
    RetrieveMeetingLink,
}

interface RequestMeetingLinkProps {
    roundIndex: number;
    meetingStartTime: Dayjs;
    meetingDurationMs: number;
    electionConfig: ActiveStateConfigType;
    stage: RoundStage;
}

/**
 *
 * For user flows and documentation, see ./request-election-meeting-link-button.md
 */
export const RequestElectionMeetingLinkButton = ({
    roundIndex,
    meetingStartTime,
    meetingDurationMs,
    electionConfig,
    stage,
}: RequestMeetingLinkProps) => {
    const [ualAccount] = useUALAccount();
    const [zoomAccountJWT, setZoomAccountJWT] = useZoomAccountJWT(undefined);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const { data: memberGroup } = useMemberGroupParticipants(
        ualAccount?.accountName,
        roundIndex
    );
    const { data: currentVoteDataRow } = useVoteDataRow(
        ualAccount?.accountName
    );

    const groupId = currentVoteDataRow
        ? calculateGroupId(roundIndex, currentVoteDataRow.index, electionConfig)
        : "";

    const {
        data: encryptedData,
        isLoading: isLoadingEncryptedData,
        refetch: refetchEncryptedData,
    } = useEncryptedData("election", groupId);

    let meetingStep = MeetingStep.LinkZoomAccount;
    if (encryptedData) meetingStep = MeetingStep.RetrieveMeetingLink;
    if (zoomAccountJWT) meetingStep = MeetingStep.CreateMeetingLink;

    if (!memberGroup || !currentVoteDataRow) {
        return null;
    }

    const handleMeetingButton = () => {
        setShowMeetingModal(true);
    };

    const requestMeetingLink = async (throwOnError: boolean = false) => {
        try {
            // TODO: Should we just pass the participants/recipients into this component?
            const recipientAccounts = memberGroup
                .map((member) => member.member)
                .filter((account) => account !== ualAccount.accountName);

            // check all the participants keys are ready to be encrypted
            // if this dummy encryption fails we know we can't create the meeting
            await encryptSecretForPublishing(
                "dummy-encryption-test",
                ualAccount.accountName,
                recipientAccounts
            );

            // eagerly check for presence of link on chain to avoid creating
            // unnecessary meetings and making user sign something for nothing.
            const { data } = await refetchEncryptedData();
            if (data) return;

            const topic = `Eden Election - Round #${roundIndex + 1}`;
            const durationInMinutes = meetingDurationMs / 1000 / 60;

            const responseData = await generateZoomMeetingLink(
                zoomAccountJWT,
                setZoomAccountJWT,
                topic,
                durationInMinutes,
                meetingStartTime.toISOString()
            );

            console.info("generated meeting data", responseData);
            if (!responseData.meeting || !responseData.meeting.join_url) {
                throw new Error("Invalid generated Meeting Link URL");
            }

            const encryptedMeetingData = await encryptSecretForPublishing(
                responseData.meeting.join_url,
                ualAccount.accountName,
                recipientAccounts
            );

            const authorizerAccount = ualAccount.accountName;
            const transaction = setElectionMeeting(
                authorizerAccount,
                roundIndex, // round number
                encryptedMeetingData.contractFormatEncryptedKeys,
                encryptedMeetingData.encryptedMessage
                // old data is optional in case we are overwriting
            );
            console.info("signing trx", transaction);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("electmeeting trx", signedTrx);
        } catch (e) {
            const error = e as Error;
            console.error(error);
            const message = error.toString();
            const linkAlreadyExistsError = message?.includes(
                "Encrypted data does not match"
            );
            // if encrypted data is already on chain; fail silently and fetch new data
            if (!linkAlreadyExistsError) {
                onError(error);
                if (throwOnError) throw error;
            }
        }
        // refetch updated encrypted data after allowing time for chains/nodes to see it
        await delay(3000);
        refetchEncryptedData();
    };

    return (
        <>
            <MeetingButton
                meetingStep={meetingStep}
                stage={stage}
                encryptedData={encryptedData}
                isLoadingEncryptedData={isLoadingEncryptedData}
                onClick={handleMeetingButton}
            />
            <MeetingLinkModal
                isOpen={showMeetingModal}
                close={() => setShowMeetingModal(false)}
                meetingStep={meetingStep}
                requestMeetingLink={requestMeetingLink}
                stage={stage}
            />
        </>
    );
};

interface MeetingButtonProps {
    meetingStep: MeetingStep;
    stage: RoundStage;
    encryptedData?: EncryptedData;
    isLoadingEncryptedData: boolean;
    onClick: () => void;
}

const MeetingButton = ({
    meetingStep,
    stage,
    encryptedData,
    isLoadingEncryptedData,
    onClick,
}: MeetingButtonProps) => {
    if (isLoadingEncryptedData) {
        return (
            <Button size="sm" isLoading disabled>
                Preparing meeting
            </Button>
        );
    }

    switch (meetingStep) {
        case MeetingStep.RetrieveMeetingLink:
            return (
                <JoinMeetingButton
                    stage={stage}
                    encryptedData={encryptedData!}
                    requestPassword={onClick}
                />
            );
        case MeetingStep.CreateMeetingLink:
            return (
                <Button size="sm" onClick={onClick}>
                    <BiWebcam className="mr-1" />
                    Get meeting link
                </Button>
            );
        case MeetingStep.LinkZoomAccount:
            return (
                <Button size="sm" onClick={onClick}>
                    <BiWebcam className="mr-1" />
                    Link Zoom account
                </Button>
            );
    }
};

interface JoinMeetingButtonProps {
    stage: RoundStage;
    encryptedData: EncryptedData;
    requestPassword: () => void;
}

const JoinMeetingButton = ({
    stage,
    encryptedData,
    requestPassword,
}: JoinMeetingButtonProps) => {
    const [roundMeetingLink, setRoundMeetingLink] = useState("");
    const [failedToDecrypt, setFailedToDecrypt] = useState(false);

    const { encryptionPassword, isLoading } = useEncryptionPassword();
    const { publicKey, privateKey } = encryptionPassword;
    const isPasswordMissing = Boolean(!isLoading && publicKey && !privateKey);

    useEffect(() => {
        decryptMeetingLink();
    }, [encryptedData, privateKey]);

    const decryptMeetingLink = async () => {
        if (encryptedData) {
            try {
                const encryptionKey = encryptedData.keys.find((k) =>
                    getEncryptionKey(k.recipient_key)
                );

                if (!encryptionKey) {
                    throw new Error(
                        "Encryption key not found to decrypt the current meeting"
                    );
                }

                const decryptedLink = await decryptPublishedMessage(
                    encryptedData.data,
                    encryptionKey.recipient_key,
                    encryptionKey.sender_key,
                    encryptionKey.key
                );

                setRoundMeetingLink(decryptedLink);
                setFailedToDecrypt(false);
            } catch (e) {
                console.error("fail to decrypt meeting link", e);
                setFailedToDecrypt(true);
            }
        } else {
            setRoundMeetingLink("");
        }
    };

    if (failedToDecrypt && isPasswordMissing) {
        return (
            <Button size="sm" onClick={requestPassword}>
                <BiWebcam className="mr-1" />
                Get meeting link
            </Button>
        );
    }

    if (failedToDecrypt) {
        return (
            <div className="flex items-center space-x-2">
                <Text type="danger">
                    <BsExclamationTriangle className="mr-1 mb-px" />
                </Text>
                <Text type="danger">
                    We were unable to decrypt the meeting link. Ask someone else
                    in your election round group for the link or join the
                    community support room above.
                </Text>
            </div>
        );
    }

    if (stage === RoundStage.PreMeeting) {
        return (
            <Text type="info">
                Meeting link will appear here when round starts.
            </Text>
        );
    }

    if (roundMeetingLink) {
        return (
            <Button
                size="sm"
                href={roundMeetingLink}
                target="_blank"
                isExternal
            >
                <BiWebcam className="mr-1" />
                Join meeting
            </Button>
        );
    }

    return null;
};

interface ModalProps {
    isOpen: boolean;
    close: () => void;
    meetingStep: MeetingStep;
    requestMeetingLink: (throwOnError: boolean) => Promise<void>;
    stage: RoundStage;
}

const MeetingLinkModal = ({
    isOpen,
    close,
    meetingStep,
    requestMeetingLink,
    stage,
}: ModalProps) => {
    const [isCreatingMeetingLink, setIsCreatingMeetingLink] = useState(false);

    const resetModalState = () => {
        setIsCreatingMeetingLink(false);
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
            <ModalStepPasswordInterjection
                close={close}
                meetingStep={meetingStep}
            />
            {meetingStep === MeetingStep.LinkZoomAccount ? (
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

interface ModalStepPasswordInterjectionProps extends ModalStepProps {
    meetingStep: MeetingStep;
}

const ModalStepPasswordInterjection = ({
    close,
    meetingStep,
}: ModalStepPasswordInterjectionProps) => {
    const encryptionPasswordResult = useEncryptionPassword();
    const {
        encryptionPassword,
        updateEncryptionPassword,
        isLoading,
    } = encryptionPasswordResult;
    const { publicKey, privateKey } = encryptionPassword;

    const [isReenteringPassword, setIsReenteringPassword] = useState(false);
    const [isCreatingPassword, setIsCreatingPassword] = useState(false);
    const isPasswordMissing = Boolean(!isLoading && publicKey && !privateKey);
    const isPasswordNotSet = !isLoading && !publicKey;

    const linkAlreadyExists = meetingStep === MeetingStep.RetrieveMeetingLink;

    const resetState = () => {
        setIsReenteringPassword(false);
        setIsCreatingPassword(false);
    };

    const cancel = () => {
        resetState();
        close();
    };

    const dismissConfirmation = () => {
        resetState();
        linkAlreadyExists && close();
    };

    if (isPasswordNotSet || isCreatingPassword) {
        return (
            <CreateNewPasswordPrompt
                onCancel={cancel}
                onBeforeUpdatePassword={() => setIsCreatingPassword(true)}
                onDismissConfirmation={dismissConfirmation}
                updateEncryptionPassword={updateEncryptionPassword}
                isTooLateForCurrentRound={linkAlreadyExists}
            />
        );
    }

    if (isPasswordMissing || isReenteringPassword) {
        return (
            <ReenterPasswordPrompt
                onCancel={cancel}
                onBeforeUpdatePassword={() => setIsReenteringPassword(true)}
                onDismissConfirmation={dismissConfirmation}
                encryptionPassword={encryptionPasswordResult}
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
