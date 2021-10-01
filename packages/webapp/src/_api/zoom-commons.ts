import { setCookie } from "nookies";

import { zoom } from "config";

import { AvailableMeetingClients } from "./schemas";

export const ZOOM_AUTHORIZATION = Buffer.from(
    zoom.clientKey + ":" + zoom.clientSecret
).toString("base64");

const ZOOM_AUTH_HEADERS = {
    Authorization: `Basic ${ZOOM_AUTHORIZATION}`,
};

export interface ZoomAccountJWT {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
}

export const zoomConnectAccountLink = `https://zoom.us/oauth/authorize?response_type=code&client_id=${zoom.clientKey}&redirect_uri=${zoom.oauthRedirect}`;

export const zoomRequestAuth = async (oauthCode: string) => {
    const response = await fetch(
        `https://zoom.us/oauth/token?grant_type=authorization_code&code=${oauthCode}&redirect_uri=${zoom.oauthRedirect}`,
        {
            method: "POST",
            headers: ZOOM_AUTH_HEADERS,
        }
    );
    const data = await response.json();
    if (response.ok) {
        return data;
    } else {
        throw data;
    }
};

export const zoomRefreshAuth = async (refreshToken: string) => {
    const response = await fetch(
        `https://zoom.us/oauth/token?grant_type=refresh_token&refresh_token=${refreshToken}`,
        {
            method: "POST",
            headers: ZOOM_AUTH_HEADERS,
        }
    );
    const data = await response.json();
    if (response.ok) {
        return data;
    } else {
        throw data;
    }
};

export const zoomAccountJWTIsExpired = (zoomAccountJWT: ZoomAccountJWT) => {
    const accessTokenEncodedData = zoomAccountJWT.access_token.split(".");
    if (accessTokenEncodedData.length !== 3)
        throw new Error("invalid zoom jwt payload");

    const accessTokenData = JSON.parse(
        Buffer.from(accessTokenEncodedData[1], "base64").toString()
    );
    if (!accessTokenData.exp) {
        throw new Error("can't parse zoom jwt expiration date");
    }
    return Date.now() > accessTokenData.exp * 1000;
};

export const zoomResponseIsInvalidAccess = (response: any) => {
    const invalidAccessToken = response?.error?.code === 124; // invalid access token
    const unauthorizedRequest = response?.type === "UnauthorizedRequestError"; // cookie missing
    return invalidAccessToken || unauthorizedRequest;
};

export const generateZoomMeetingLink = async (
    setZoomLinkedAccount: (isZoomAccountLinked: boolean) => void,
    topic: string,
    durationInMinutes: number,
    startTime: string
) => {
    const response = await fetch(`/api/meeting-links`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
            client: AvailableMeetingClients.Zoom,
            topic,
            duration: durationInMinutes,
            startTime,
        }),
    });

    const responseData = await response.json();
    if (zoomResponseIsInvalidAccess(responseData)) {
        // TODO: clear any zoom cookies that might be present?
        setZoomLinkedAccount(false);
    }

    return responseData;
};

export const setZoomJWTCookie = (zoomAccountJWT: any, res: any) => {
    if (zoomAccountJWT) {
        setCookie(
            { res },
            "zoomAccountJWT",
            Buffer.from(JSON.stringify(zoomAccountJWT)).toString("base64"),
            {
                httpOnly: true,
                path: "/api",
                secure: true,
            }
        );
    } else {
        console.info("destroying cookie");
        res.setHeader("Set-Cookie", "zoomAccountJWT=; Path=/api; Max-Age=-1;");
    }
};
