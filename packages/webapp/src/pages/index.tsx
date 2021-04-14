import { Link, SingleColLayout } from "_app";

export const Index = () => (
    <SingleColLayout title="Community">
        <ul>
            <li>
                <Link href="/members">Members Page</Link>
            </li>
        </ul>
    </SingleColLayout>
);

export default Index;
