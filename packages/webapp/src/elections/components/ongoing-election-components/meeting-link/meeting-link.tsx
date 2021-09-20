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
import { useEncryptionPassword, usePasswordModal } from "encryption";

import MeetingButtons from "./meeting-buttons";
import MeetingLinkModal from "./meeting-link-modal";
import { freeMeetingLinksEnabled } from "config";
import { validateMeetingLink } from "_app/utils/meetings";

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

    const { show: showPasswordModal } = usePasswordModal();
    const {
        isPasswordNotSet,
        isPasswordSetNotPresent,
    } = useEncryptionPassword();

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
    } else if (zoomAccountJWT || freeMeetingLinksEnabled) {
        meetingStep = MeetingStep.CreateMeetingLink;
    }

    if (!memberGroup || !currentVoteDataRow) {
        return null;
    }

    const showMeetingLinkModal = () => {
        setShowMeetingModal(true);
    };

    const handleMeetingButton = async () => {
        if (isPasswordNotSet || isPasswordSetNotPresent) {
            const linkAlreadyExists =
                meetingStep === MeetingStep.RetrieveMeetingLink;
            const completed = await showPasswordModal(linkAlreadyExists);
            // if the user canceled, do nothing -- just dismiss
            completed && !linkAlreadyExists && showMeetingLinkModal();
        } else {
            showMeetingLinkModal();
        }
    };

    // TODO: Should we just pass the participants/recipients into this component?
    const recipientAccounts = memberGroup
        .map((member) => member.member)
        .filter((account) => account !== ualAccount.accountName);

    const checkSubmissionIsAllowed = async () => {
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
        // TODO: attempt to decrypt here; if unsuccessful, throw error and inform user they're new password will only work for upcoming rounds / elections

        if (data) return;
    };

    const submitMeetingLink = async (meetingLink: string) => {
        validateMeetingLink(meetingLink);
        await checkSubmissionIsAllowed();
        await signAndPublishMeeting(meetingLink);
    };

    const requestMeetingLink = async () => {
        await checkSubmissionIsAllowed();

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

        await signAndPublishMeeting(responseData.meeting.join_url);
    };

    const signAndPublishMeeting = async (meetingLink: string) => {
        try {
            const encryptedMeetingData = await encryptSecretForPublishing(
                meetingLink,
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
            const message = error.toString();
            const linkAlreadyExistsError = message?.includes(
                "Encrypted data does not match"
            );
            // if encrypted data is already on chain; fail silently and fetch new data
            if (!linkAlreadyExistsError) {
                throw error;
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
            <MeetingLinkModal
                isOpen={showMeetingModal}
                close={() => setShowMeetingModal(false)}
                meetingStep={meetingStep}
                requestMeetingLink={requestMeetingLink}
                submitMeetingLink={submitMeetingLink}
                stage={stage}
            />
        </>
    );
};

export default MeetingLink;
