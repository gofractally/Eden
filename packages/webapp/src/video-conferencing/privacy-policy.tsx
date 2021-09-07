import { Container, Text } from "_app/ui";

export const ZoomPrivacyPolicy = () => {
    return (
        <Container className="space-y-2.5">
            <Text>
                Your Zoom account will be used to schedule Eden election
                meetings on your behalf for members participating in your Eden
                election groups during the course of an ongoing election.
            </Text>
            <Text>
                NONE of your personal information nor any credentials, tokens or
                keys relating to your Zoom account are ever stored, persisted or
                retained on any server or database. The only information used by
                EdenOS is your Zoom OAuth token, and that is stored only in your
                local web browser.
            </Text>
            <Text>
                Whenever you request that an election meeting be scheduled by
                EdenOS on your behalf, that OAuth token is sent, ephemerally, to
                a stateless, serverless function which creates the meeting on
                your Zoom account on your behalf. Your token is then immediately
                forgotten by the server.
            </Text>
            <Text>
                This means that resetting your browser or clearing your
                browser's cache or settings is sufficient to deny the EdenOS
                application further access to your OAuth token and prevent it
                from creating further meetings on your Zoom account on your
                behalf.
            </Text>
        </Container>
    );
};

export default ZoomPrivacyPolicy;
