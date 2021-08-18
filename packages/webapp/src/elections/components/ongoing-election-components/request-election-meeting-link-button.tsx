import { BiWebcam } from "react-icons/bi";
import { Dayjs } from "dayjs";

import {
    Button,
    encryptSecretForPublishing,
    onError,
    useMemberGroupParticipants,
    useUALAccount,
    useZoomAccountJWT,
} from "_app";
import {
    generateZoomMeetingLink,
    zoomConnectAccountLink,
} from "_api/zoom-commons";
import { setElectionMeeting } from "elections/transactions";

interface MeetingLinkProps {
    roundIndex: number;
    meetingStartTime: Dayjs;
    meetingDurationMs: number;
}

export const RequestElectionMeetingLinkButton = ({
    roundIndex,
    meetingStartTime,
    meetingDurationMs,
}: MeetingLinkProps) => {
    const [ualAccount] = useUALAccount();
    const [zoomAccountJWT, setZoomAccountJWT] = useZoomAccountJWT(undefined);
    const { data: memberGroup } = useMemberGroupParticipants(
        ualAccount?.accountName,
        roundIndex
    );

    if (!memberGroup) {
        return null;
    }

    // TODO: Should we just pass the participants into this component?
    const participantAccounts = memberGroup.map((member) => member.member);

    const roundMeetingLink = undefined; // todo: get the round meeting link if generated

    const linkZoomAccount = () => {
        window.location.href =
            zoomConnectAccountLink + "&state=request-election-link";
    };

    const requestMeetingLink = async () => {
        try {
            // check all the participants keys are ready to be encrypted
            // if this dummy encryption fails we know we can't create the meeting
            await encryptSecretForPublishing(
                "dummy-encryption-test",
                ualAccount.accountName,
                participantAccounts
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
                participantAccounts
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

            // todo: refetch the round data to set the new defined roundMeetingLink
        } catch (error) {
            console.error(error);
            onError(error);
        }
    };

    return roundMeetingLink ? (
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
