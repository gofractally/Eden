import { BiWebcam } from "react-icons/bi";
import { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { BsExclamationTriangle } from "react-icons/bs";

import {
    Button,
    decryptPublishedMessage,
    encryptSecretForPublishing,
    onError,
    queryVoteDataRow,
    Text,
    useEncryptedData,
    useMemberGroupParticipants,
    useUALAccount,
    useVoteDataRow,
    useZoomAccountJWT,
} from "_app";
import {
    generateZoomMeetingLink,
    zoomConnectAccountLink,
} from "_api/zoom-commons";
import { setElectionMeeting } from "elections/transactions";
import { calculateGroupId } from "elections/utils";
import { ActiveStateConfigType, RoundStage } from "elections/interfaces";
import { EncryptedData, getEncryptionKey } from "encryption";

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
        isLoading: loadingEncryptedData,
    } = useEncryptedData("election", groupId);

    if (!memberGroup || !currentVoteDataRow) {
        return null;
    }

    const linkZoomAccount = () => {
        window.location.href =
            zoomConnectAccountLink + "&state=request-election-link";
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

    return loadingEncryptedData ? (
        <>Loading meeting link...</>
    ) : encryptedData ? (
        <JoinMeetingButton stage={stage} encryptedData={encryptedData} />
    ) : zoomAccountJWT ? (
        <Button size="sm" onClick={requestMeetingLink}>
            <BiWebcam className="mr-1" />
            Request meeting link
        </Button>
    ) : (
        <Button size="sm" onClick={linkZoomAccount}>
            <BiWebcam className="mr-1" />
            Link Zoom account to request a meeting link
        </Button>
    );
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
