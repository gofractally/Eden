import { Container, Link, Text } from "_app/ui";

export const ZoomSupport = () => {
    return (
        <Container className="space-y-2.5">
            <Text>
                If you need help with Zoom during an election, we recommend
                reaching out via the private "Eden Members" Telegram channel,
                which is restricted to Eden members. If you are currently a
                member but do not have access to this channel, ask your inviter
                or delegate for an invite. During an ongoing election, you will
                also have access to a public Community Zoom Room where you can
                ask for assistance.
            </Text>
            <Text>
                For general questions about the EdenOS Genesis integration with
                Zoom, please reach out via the{" "}
                <Link href="https://t.me/eden_dev" target="_blank" isExternal>
                    public EdenOS developers' Telegram channel
                </Link>
                .
            </Text>
            <Text>
                If you need an alternative to Telegram, you can also get help by
                posting on the{" "}
                <Link
                    href="https://forums.eoscommunity.org"
                    target="_blank"
                    isExternal
                >
                    EOSCommunity.org forums
                </Link>
                .
            </Text>
        </Container>
    );
};

export default ZoomSupport;
