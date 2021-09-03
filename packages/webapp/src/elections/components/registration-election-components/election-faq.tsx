import { Container, Expander, Heading } from "_app";

export const ElectionFAQ = () => {
    return (
        <>
            <Container darkBg>
                <Heading size={2}>Election FAQ</Heading>
            </Container>
            <Expander header="What is an election like?" darkBg>
                <Container>Answers coming soon.</Container>
            </Expander>
            <Expander header="What's in it for me?" darkBg>
                <Container>Answers coming soon.</Container>
            </Expander>
        </>
    );
};

export default ElectionFAQ;
