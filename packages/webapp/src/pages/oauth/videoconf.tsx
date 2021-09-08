import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

import {
    SideNavLayout,
    useUALAccount,
    useZoomAccountJWT,
    encryptSecretForPublishing,
    onError,
} from "_app";
import {
    Button,
    CallToAction,
    Container,
    Heading,
    Loader,
    Text,
} from "_app/ui";

import { setElectionMeeting } from "elections";

import {
    zoomRequestAuth,
    zoomConnectAccountLink,
    generateZoomMeetingLink,
} from "_api/zoom-commons";

export const getServerSideProps: GetServerSideProps = async ({
    query,
    req,
}) => {
    const oauthCode = (query.code as string) || "";
    const oauthState = (query.state as string) || "";
    let newZoomAccountJWT = null;

    if (oauthCode) {
        const oauthDataResponse = await zoomRequestAuth(oauthCode);
        if (oauthDataResponse.error) {
            console.error(
                "fail to auth zoom code",
                oauthCode,
                oauthDataResponse
            );
        } else {
            newZoomAccountJWT = oauthDataResponse;
        }
    }

    return {
        props: {
            newZoomAccountJWT,
            oauthState,
        },
    };
};

interface Props {
    newZoomAccountJWT: any;
    oauthState: string;
}

export const ZoomOauthPage = ({ newZoomAccountJWT, oauthState }: Props) => {
    const [ualAccount, _, ualShowModal] = useUALAccount();
    const [_zoomAccountJWT, setZoomAccountJWT] = useZoomAccountJWT(undefined);
    const router = useRouter();
    const [redirectMessage, setRedirectMessage] = useState("");

    useEffect(() => {
        if (newZoomAccountJWT) {
            setZoomAccountJWT(newZoomAccountJWT);

            if (oauthState === "request-election-link") {
                setRedirectMessage(
                    "Hold tight while we redirect you back to your in-progress election round."
                );
                router.push("/election");
            }
        }
    }, []);

    return (
        <SideNavLayout title="Zoom Test" className="divide-y border-b">
            <Container>
                <Heading size={1}>Video conferencing for EdenOS</Heading>
            </Container>
            {redirectMessage ? (
                <Container className="space-y-4 py-16 text-center">
                    <Heading size={2}>Your Zoom account is linked</Heading>
                    <Text className="pb-8">{redirectMessage}</Text>
                    <Loader />
                </Container>
            ) : ualAccount ? ( // TODO: maybe we can even remove the ualAccount guard from this to allow the Zoom Marketplace review
                <ZoomTestContainer ualAccount={ualAccount} />
            ) : (
                <CallToAction buttonLabel="Sign in" onClick={ualShowModal}>
                    Welcome to Eden. Sign in using your wallet.
                </CallToAction>
            )}
        </SideNavLayout>
    );
};

export default ZoomOauthPage;

const ZoomTestContainer = ({ ualAccount }: any) => {
    const [zoomAccountJWT, setZoomAccountJWT] = useZoomAccountJWT(undefined);

    const doGenerateZoomMeetingLink = async () => {
        try {
            const responseData = await generateZoomMeetingLink(
                zoomAccountJWT,
                setZoomAccountJWT,
                `Test Eden Election #${Math.floor(
                    Math.random() * 100_000_000
                )}`,
                40,
                `2025-08-15T${Math.floor(Math.random() * 23)}:${Math.floor(
                    Math.random() * 59
                )}:00Z`
            );

            console.info(responseData);
            if (!responseData.meeting || !responseData.meeting.join_url) {
                throw new Error("Invalid generated Meeting Link URL");
            }

            const encryptedMeetingData = await encryptSecretForPublishing(
                responseData.meeting.join_url,
                ualAccount.accountName,
                ["alice.edev", "egeon.edev"]
                // info is optional, if the info is present in the encryption
                // process, it also needs to be present during the decryption
            );

            const authorizerAccount = ualAccount.accountName;
            const transaction = setElectionMeeting(
                authorizerAccount,
                1, // round number
                encryptedMeetingData.contractFormatEncryptedKeys,
                encryptedMeetingData.encryptedMessage
                // old data is optional in case we are overwriting
            );
            console.info("signing trx", transaction);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("inductmeetin trx", signedTrx);

            alert(JSON.stringify(responseData, undefined, 2));
        } catch (error) {
            console.error(error);
            onError(error as Error);
        }
    };

    return (
        <Container className="space-y-4">
            {zoomAccountJWT ? (
                <>
                    <Text>
                        Thanks for connecting Eden to your Zoom account.
                    </Text>
                    <Text>Next step is to create a meeting.</Text>
                    <Button onClick={doGenerateZoomMeetingLink}>
                        Dummy election meeting
                    </Button>
                </>
            ) : (
                <Button href={zoomConnectAccountLink}>
                    Link your Zoom account
                </Button>
            )}
        </Container>
    );
};
