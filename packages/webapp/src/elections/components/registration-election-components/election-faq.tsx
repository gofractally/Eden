import { Container, Expander, Heading } from "_app";

export const ElectionFAQ = () => {
    return (
        <div className="bg-gray-50 divide-y">
            <Container darkBg>
                <Heading size={2}>Election FAQ</Heading>
            </Container>
            <Expander header="What is an election like?">
                <Container>Answers coming soon.</Container>
            </Expander>
            <Expander header="What's in it for me?">
                <Container>Answers coming soon.</Container>
            </Expander>
        </div>
    );
};

export default ElectionFAQ;
