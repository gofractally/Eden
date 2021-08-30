import { useState } from "react";
import { Dayjs } from "dayjs";

import {
    delay,
    encryptSecretForPublishing,
    onError,
    useEncryptedData,
    useMemberGroupParticipants,
    useUALAccount,
    useVoteDataRow,
    useZoomAccountJWT,
} from "_app";
import { generateZoomMeetingLink } from "_api/zoom-commons";
import { setElectionMeeting } from "elections/transactions";
import { calculateGroupId } from "elections/utils";
import { ActiveStateConfigType, RoundStage } from "elections/interfaces";

import MeetingButtons from "./meeting-buttons";
import MeetingLinkModal from "./meeting-link-modal";
import PromptCreateKeyModal from "encryption/components/prompt-create-key-modal";
import PromptReenterKeyModal from "encryption/components/prompt-reenter-key-modal";

export enum MeetingStep {
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
export const MeetingLink = ({
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
    if (encryptedData) {
        meetingStep = MeetingStep.RetrieveMeetingLink;
    } else if (zoomAccountJWT) {
        meetingStep = MeetingStep.CreateMeetingLink;
    }

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
            <MeetingButtons
                meetingStep={meetingStep}
                stage={stage}
                encryptedData={encryptedData}
                isLoadingEncryptedData={isLoadingEncryptedData}
                onClick={handleMeetingButton}
            />
            <Modals
                isOpen={showMeetingModal}
                close={() => setShowMeetingModal(false)}
                meetingStep={meetingStep}
                requestMeetingLink={requestMeetingLink}
                stage={stage}
            />
        </>
    );
};

export default MeetingLink;

interface ModalsProps {
    isOpen: boolean;
    close: () => void;
    meetingStep: MeetingStep;
    requestMeetingLink: (throwOnError: boolean) => Promise<void>;
    stage: RoundStage;
}

const Modals = ({
    isOpen,
    close,
    meetingStep,
    requestMeetingLink,
    stage,
}: ModalsProps) => {
    const [isFixingPassword, setIsFixingPassword] = useState(false);
    const linkAlreadyExists = meetingStep === MeetingStep.RetrieveMeetingLink;

    const cancel = () => {
        setIsFixingPassword(false);
        close();
    };

    const dismissPasswordSuccessConfirmation = () => {
        setIsFixingPassword(false);
        linkAlreadyExists && close();
    };

    return (
        <>
            <PromptCreateKeyModal
                isOpen={isOpen} // only opens if password is unset
                onAfterOpen={() => setIsFixingPassword(true)}
                close={cancel}
                onDismissConfirmation={dismissPasswordSuccessConfirmation}
                isTooLateForCurrentRound={linkAlreadyExists}
            />
            <PromptReenterKeyModal
                isOpen={isOpen} // only opens if password is missing
                onAfterOpen={() => setIsFixingPassword(true)}
                close={cancel}
                onDismissConfirmation={dismissPasswordSuccessConfirmation}
                isTooLateForCurrentRound={linkAlreadyExists}
            />
            <MeetingLinkModal
                isOpen={isOpen && !isFixingPassword}
                close={close}
                meetingStep={meetingStep}
                requestMeetingLink={requestMeetingLink}
                stage={stage}
            />
        </>
    );
};
