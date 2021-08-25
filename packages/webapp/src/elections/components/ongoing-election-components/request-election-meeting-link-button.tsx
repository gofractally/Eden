import { BiWebcam } from "react-icons/bi";
import { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { BsExclamationTriangle } from "react-icons/bs";

import {
    decryptPublishedMessage,
    encryptSecretForPublishing,
    onError,
    queryVoteDataRow,
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
} from "encryption";

enum MeetingStep {
    LinkZoomAccount,
    CreateMeetingLink,
    LoadingMeetingLink,
    RetrieveMeetingLink,
}

interface RequestMeetingLinkProps {
    roundIndex: number;
    meetingStartTime: Dayjs;
    meetingDurationMs: number;
    electionConfig: ActiveStateConfigType;
    stage: RoundStage;
}

export const RequestElectionMeetingLinkButton = ({
    roundIndex,
    meetingStartTime,
    meetingDurationMs,
    electionConfig,
    stage,
}: RequestMeetingLinkProps) => {
    const queryClient = useQueryClient();
    const [ualAccount] = useUALAccount();
    const [zoomAccountJWT, setZoomAccountJWT] = useZoomAccountJWT(undefined);
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [meetingStep, setMeetingStep] = useState(
        MeetingStep.LoadingMeetingLink
    );
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
    } = useEncryptedData("election", groupId);

    useEffect(() => {
        if (isLoadingEncryptedData) {
            setMeetingStep(MeetingStep.LoadingMeetingLink);
        } else if (encryptedData) {
            setMeetingStep(MeetingStep.RetrieveMeetingLink);
        } else if (zoomAccountJWT) {
            setMeetingStep(MeetingStep.CreateMeetingLink);
        } else {
            setMeetingStep(MeetingStep.LinkZoomAccount);
        }
    }, [zoomAccountJWT, isLoadingEncryptedData, encryptedData]);

    if (!memberGroup || !currentVoteDataRow) {
        return null;
    }

    const handleMeetingButton = () => {
        setShowMeetingModal(true);
    };

    const requestMeetingLink = async () => {
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

            queryClient.invalidateQueries(
                queryVoteDataRow(ualAccount.accountName).queryKey
            );
        } catch (error) {
            console.error(error);
            onError(error);
        }
    };

    return (
        <>
            <MeetingButton
                meetingStep={meetingStep}
                stage={stage}
                encryptedData={encryptedData}
                requestMeetingLink={requestMeetingLink}
                onClick={handleMeetingButton}
            />
            <MeetingLinkModal
                isOpen={showMeetingModal}
                close={() => setShowMeetingModal(false)}
            />
        </>
    );
};

interface MeetingButtonProps {
    meetingStep: MeetingStep;
    stage: RoundStage;
    encryptedData?: EncryptedData;
    requestMeetingLink: () => Promise<void>;
    onClick: () => void;
}

const MeetingButton = ({
    meetingStep,
    stage,
    encryptedData,
    requestMeetingLink,
    onClick,
}: MeetingButtonProps) => {
    switch (meetingStep) {
        case MeetingStep.LoadingMeetingLink:
            return <>Loading meeting link...</>;
        case MeetingStep.RetrieveMeetingLink:
            return (
                <JoinMeetingButton
                    stage={stage}
                    encryptedData={encryptedData!}
                />
            );
        case MeetingStep.CreateMeetingLink:
            return (
                <Button size="sm" onClick={requestMeetingLink}>
                    <BiWebcam className="mr-1" />
                    Request meeting link
                </Button>
            );
        case MeetingStep.LinkZoomAccount:
            return (
                <Button size="sm" onClick={onClick}>
                    <BiWebcam className="mr-1" />
                    Link Zoom account to request a meeting link
                </Button>
            );
    }
};

interface JoinMeetingButtonProps {
    stage: RoundStage;
    encryptedData: EncryptedData;
}

const JoinMeetingButton = ({
    stage,
    encryptedData,
}: JoinMeetingButtonProps) => {
    const [roundMeetingLink, setRoundMeetingLink] = useState("");
    const [
        failedToDecryptMeetingLink,
        setFailedToDecryptMeetingLink,
    ] = useState(false);

    useEffect(() => {
        decryptMeetingLink();
    }, [encryptedData]);

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
            } catch (e) {
                console.error("fail to decrypt meeting link", e);
                onError(e.message);
                setFailedToDecryptMeetingLink(true);
            }
        } else {
            setRoundMeetingLink("");
        }
    };

    return failedToDecryptMeetingLink ? (
        <div className="flex items-center space-x-2">
            <Text type="danger">
                <BsExclamationTriangle className="mr-1 mb-px" />
            </Text>
            <Text type="danger">
                Failed to retrieve meeting link. Ask someone else in your
                election round group for the link or join the community support
                room above.
            </Text>
        </div>
    ) : stage === RoundStage.PreMeeting ? (
        <Text type="info">
            Waiting for meeting to start to display the join button.
        </Text>
    ) : roundMeetingLink ? (
        <Button size="sm" href={roundMeetingLink} target="_blank">
            <BiWebcam className="mr-1" />
            Join meeting
        </Button>
    ) : null;
};

interface ModalProps {
    isOpen: boolean;
    close: () => void;
}

const MeetingLinkModal = ({ isOpen, close }: ModalProps) => {
    const encryptionPasswordResult = useEncryptionPassword();
    const { encryptionPassword, isLoading } = encryptionPasswordResult;

    const [isReenteringPassword, setIsReenteringPassword] = useState(false);

    const isKeyMissing = Boolean(
        !isLoading &&
            encryptionPassword.publicKey &&
            !encryptionPassword.privateKey
    );

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={close}
            // onAfterClose={() => setStep(ParticipationStep.ConfirmParticipation)}
            contentLabel="Election round meeting link confirmation modal"
            preventScroll
            shouldCloseOnOverlayClick={!isReenteringPassword}
            shouldCloseOnEsc={!isReenteringPassword}
        >
            {isKeyMissing || isReenteringPassword ? (
                <ReenterPasswordPrompt
                    onCancel={close}
                    onBeforeUpdatePassword={() => setIsReenteringPassword(true)}
                    onDismissConfirmation={() => setIsReenteringPassword(false)}
                    encryptionPassword={encryptionPasswordResult}
                />
            ) : (
                <ModalStepZoom close={close} />
            )}
        </Modal>
    );
};

const ModalStepZoom = ({ close }: { close: () => void }) => {
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
