import { Container, Heading, Link, Text } from "_app";

interface Props {
    className?: string;
}

export const WelcomeText = ({ className = "" }: Props) => (
    <div className={className}>
        <Container className="grid grid-cols-2 gap-2.5 lg:gap-4">
            <FirstParagraph className="col-span-2 lg:col-span-1" />
            <SecondParagraph className="col-span-2 lg:col-span-1" />
        </Container>
    </div>
);

export default WelcomeText;

const FirstParagraph = ({ className = "" }: { className?: string }) => (
    <div className={"space-y-2.5 " + className}>
        <Heading size={2}>Welcome to Eden</Heading>
        <Text>
            A team of people can be more powerful than the sum of its members,
            but all teams need a means to reach consensus, or they will fall
            apart. Unfortunately, traditional democratic processes end up
            empowering politicians and disempowering the people who participate.
        </Text>
    </div>
);

const SecondParagraph = ({ className = "" }: { className?: string }) => (
    <div className={"space-y-2.5 " + className}>
        <Text>
            EdenOS is a revolutionary new democratic process that protects and
            enhances the independence and power of those who join. When you join
            the Eden community, you gain access to a group of people working
            together to empower you and your family to make a bigger impact in
            the world.
        </Text>
        <Text>
            To learn more about Eden and how you can get involved, visit{" "}
            <Link href="https://edenelections.com" target="_blank" isExternal>
                edenelections.com
            </Link>
            .
        </Text>
    </div>
);
