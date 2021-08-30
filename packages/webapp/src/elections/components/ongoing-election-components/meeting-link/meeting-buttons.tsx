import { useEffect, useState } from "react";
import { BiWebcam } from "react-icons/bi";
import { BsExclamationTriangle } from "react-icons/bs";

import { decryptPublishedMessage } from "_app";
import { Button, Text } from "_app/ui";
import { RoundStage } from "elections/interfaces";
import {
    EncryptedData,
    getEncryptionKey,
    useEncryptionPassword,
} from "encryption";

import { MeetingStep } from "./meeting-link";

interface MeetingButtonsProps {
    meetingStep: MeetingStep;
    stage: RoundStage;
    encryptedData?: EncryptedData;
    isLoadingEncryptedData: boolean;
    onClick: () => void;
}

export const MeetingButtons = ({
    meetingStep,
    stage,
    encryptedData,
    isLoadingEncryptedData,
    onClick,
}: MeetingButtonsProps) => {
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
                    Sign in with Zoom
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

    const {
        encryptionPassword,
        isPasswordNotSet,
        isPasswordSetNotPresent,
    } = useEncryptionPassword();

    useEffect(() => {
        decryptMeetingLink();
    }, [encryptedData, encryptionPassword.privateKey]);

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

    if (failedToDecrypt && isPasswordSetNotPresent) {
        return (
            <Button size="sm" onClick={requestPassword}>
                <BiWebcam className="mr-1" />
                Get meeting link
            </Button>
        );
    }

    if (failedToDecrypt) {
        return (
            <div className="space-y-1">
                <Button size="sm" disabled onClick={() => {}}>
                    <BsExclamationTriangle size={15} className="mr-1 mb-px" />
                    Join meeting
                </Button>
                <p
                    className="text-red-500"
                    style={{ fontSize: 13, lineHeight: "15px" }}
                >
                    Could not get meeting link for this round. Reach out to
                    others in your group via Telegram or otherwise to ask for
                    the meeting link.
                    {isPasswordNotSet &&
                        " Click the banner above to create an election password so you can access the meeting link in the next round."}
                </p>
            </div>
        );
    }

    const isPreMeeting = stage === RoundStage.PreMeeting;

    return (
        <>
            {isPreMeeting ? (
                <Text>Join meeting button activates when round starts.</Text>
            ) : (
                <Text>The round has started. Join your meeting.</Text>
            )}
            <Button
                size="sm"
                href={isPreMeeting ? undefined : roundMeetingLink}
                target={isPreMeeting ? undefined : "_blank"}
                isExternal
                disabled={isPreMeeting}
            >
                <BiWebcam className="mr-1" />
                Join meeting
            </Button>
        </>
    );
};

export default MeetingButtons;
