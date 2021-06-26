import { RawLayout } from "./raw-layout";

interface Props {
    title?: string;
    children: React.ReactNode;
}

export const SingleColLayout = ({ children, title }: Props) => (
    <RawLayout title={title}>
        <div className="sm:px-4 max-w-screen-xl mx-auto">{children}</div>
    </RawLayout>
);
