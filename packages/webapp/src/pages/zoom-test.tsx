import { SingleColLayout, CallToAction, useUALAccount, Button } from "_app";
import { zoom } from "config";

import { GetServerSideProps } from "next";

const ZOOM_AUTHORIZATION = Buffer.from(
    zoom.clientKey + ":" + zoom.clientSecret
).toString("base64");

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const oauthCode = (query.code as string) || "";
    let oauthAccessData = null;

    if (oauthCode) {
        const zoomResponse = await fetch(
            `https://zoom.us/oauth/token?grant_type=authorization_code&code=${oauthCode}&redirect_uri=${zoom.oauthRedirect}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Basic ${ZOOM_AUTHORIZATION}`,
                },
            }
        );
        const oauthDataResponse = await zoomResponse.json();
        if (oauthDataResponse.error) {
            console.error(
                "fail to auth zoom code",
                oauthCode,
                oauthDataResponse
            );
        } else {
            oauthAccessData = oauthDataResponse;
        }
    }

    return {
        props: {
            oauthAccessData,
        },
    };
};

interface Props {
    oauthAccessData: any;
}

export const ZoomTestPage = ({ oauthAccessData }: Props) => {
    const [ualAccount, _, ualShowModal] = useUALAccount();

    return (
        <SingleColLayout title="Zoom Test">
            {ualAccount ? (
                <ZoomTestContainer
                    ualAccount={ualAccount}
                    oauthAccessData={oauthAccessData}
                />
            ) : (
                <CallToAction buttonLabel="Sign in" onClick={ualShowModal}>
                    Welcome to Eden. Sign in using your wallet.
                </CallToAction>
            )}
        </SingleColLayout>
    );
};

export default ZoomTestPage;

const ZoomTestContainer = ({ ualAccount, oauthAccessData }: any) => {
    const linkZoomAccount = () => {
        // const electionRoom = Math.floor(Math.random() * 100_000_000);
        // const oauthRedirect = `${zoom.oauthRedirect}?election_room=${electionRoom}`;
        const oauthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoom.clientKey}&redirect_uri=${zoom.oauthRedirect}`;
        return oauthUrl;
    };

    const generateZoomMeetingLink = async () => {
        const accessToken = oauthAccessData.access_token;
        if (!accessToken) {
            return alert("Invalid AccessToken");
        }

        const body = {
            topic: "Test Eden Election #5",
            duration: 40,
            start_time: "2025-08-15T13:35:00Z",
            settings: {
                join_before_host: true,
                jbh_time: 0,
                auto_recording: "local",
            },
        };

        const response = await fetch(`/api/meeting-links`, {
            method: "POST",
            body: JSON.stringify({ accessToken, meetingClient: "zoom" }),
        });

        const responseData = await response.json();
        console.info(responseData);

        alert(JSON.stringify(responseData, undefined, 2));
    };

    console.info(oauthAccessData);

    return (
        <div>
            {oauthAccessData ? (
                <div>
                    Thanks for connecting Eden to your Zoom account.
                    <p>
                        Next step is to create a meeting. <br />
                        <Button onClick={generateZoomMeetingLink}>
                            Create a new Meeting
                        </Button>
                    </p>
                </div>
            ) : (
                <Button href={linkZoomAccount()}>Link your Zoom Account</Button>
            )}
        </div>
    );
};
