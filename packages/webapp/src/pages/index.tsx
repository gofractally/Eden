import { MemberCard } from "members/card";
import { Heading } from "ui";

export const Index = () => (
    <>
        <Heading>Hello Eden Community!</Heading>
        <p>Here is Dans Image:</p>
        <img src="/images/dan-card.jpg" />
        <MemberCard />
    </>
);

export default Index;
