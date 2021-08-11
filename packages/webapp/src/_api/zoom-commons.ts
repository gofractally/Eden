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
    return false; // TODO: fix and calculate it properly
};

export const zoomResponseIsInvalidAccess = (response: any) => {
    return response && response.error && response.error.code === 124; // invalid access token
};

export const generateZoomMeetingLink = async (
    zoomAccountJWT: any,
    setZoomAccountJWT: (updatedJwt: any) => void,
    topic: string,
    durationInMinutes: number,
    startTime: string
) => {
    let accessToken = zoomAccountJWT.access_token;
    if (!accessToken) {
        throw new Error("Invalid AccessToken");
    }

    if (zoomAccountJWTIsExpired(zoomAccountJWT)) {
        const newTokensResponse = await fetch(`/api/refresh-zoom`, {
            method: "POST",
            body: JSON.stringify({
                refreshToken: zoomAccountJWT.refresh_token,
            }),
        });

        const newTokens = await newTokensResponse.json();
        if (!newTokensResponse.ok) {
            setZoomAccountJWT(undefined);
        }

        setZoomAccountJWT(newTokens);
        accessToken = newTokens.access_token;
    }

    const response = await fetch(`/api/meeting-links`, {
        method: "POST",
        body: JSON.stringify({
            accessToken,
            client: AvailableMeetingClients.Zoom,
            topic,
            duration: durationInMinutes,
            startTime,
        }),
    });

    const responseData = await response.json();
    if (zoomResponseIsInvalidAccess(responseData)) {
        setZoomAccountJWT(undefined);
    }

    return responseData;
};
