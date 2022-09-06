import { Container, Heading, Button } from "_app";

interface Props {
    className?: string;
}

export const LearnMoreCTA = ({ className = "" }: Props) => (
    <div className={className}>
        <Container className="space-y-2.5">
            <Heading size={3}>
                Eden is a community working to maximize the power and
                independence of its members, thereby securing life, liberty,
                property, and justice for all.
            </Heading>
            <Button
                href="https://edeneos.org"
                className="flex-shrink-0 mt-10 sm:mt-0"
                target="_blank"
                isExternal
            >
                Learn more
            </Button>
        </Container>
    </div>
);

export default LearnMoreCTA;
