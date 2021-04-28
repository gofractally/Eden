import { Card, Link, SingleColLayout } from "_app";

export const Index = () => (
    <SingleColLayout>
        <Card title="Eden on EOS">
            <ul>
                <li>
                    <Link href="/about">About Eden</Link>
                </li>
                <li>
                    <Link href="/members">The Community</Link>
                </li>
                <li>
                    <Link href="/induction">Membership</Link>
                </li>
            </ul>
        </Card>
    </SingleColLayout>
);

export default Index;
