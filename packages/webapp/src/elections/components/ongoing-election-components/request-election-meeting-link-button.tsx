import { BiWebcam } from "react-icons/bi";
import { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useQueryClient } from "react-query";

import {
    Button,
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
import {
    generateZoomMeetingLink,
    zoomConnectAccountLink,
} from "_api/zoom-commons";
import { setElectionMeeting } from "elections/transactions";
import { calculateGroupId } from "elections/utils";
import { ActiveStateConfigType } from "elections/interfaces";
import { getEncryptionKey } from "encryption";

interface RequestMeetingLinkProps {
    roundIndex: number;
    meetingStartTime: Dayjs;
    meetingDurationMs: number;
    electionConfig: ActiveStateConfigType;
}

export const RequestElectionMeetingLinkButton = ({
    roundIndex,
    meetingStartTime,
    meetingDurationMs,
    electionConfig,
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

    const [roundMeetingLink, setRoundMeetingLink] = useState("");

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
            }
        } else {
            setRoundMeetingLink("");
        }
    };

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
        <>Loading Meeeting Link...</>
    ) : roundMeetingLink ? (
        <Button size="sm" href={roundMeetingLink} target="_blank">
            <BiWebcam className="mr-1" />
            Join meeting
        </Button>
    ) : zoomAccountJWT ? (
        <Button size="sm" onClick={requestMeetingLink}>
            <BiWebcam className="mr-1" />
            Request meeting link
        </Button>
    ) : (
        <Button size="sm" onClick={linkZoomAccount}>
            <BiWebcam className="mr-1" />
            Link Zoom Account to Request a meeting link
        </Button>
    );
};
