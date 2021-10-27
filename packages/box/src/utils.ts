import WebSocketClient from "ws";

export const webSocketFactory = async (
    url: string,
    protocols: string[] = []
): Promise<WebSocketClient> => {
    const webSocket = new WebSocketClient(url, protocols, {
        handshakeTimeout: 30 * 1000, // 30s
        maxPayload: 10 * 1024 * 1024,
    });
    return webSocket;
};
