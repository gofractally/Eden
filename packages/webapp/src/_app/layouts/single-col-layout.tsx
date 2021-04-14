import { RawLayout } from "./raw-layout";

interface Props {
    title?: string;
    children: React.ReactNode;
}

export const SingleColLayout = ({ children, title }: Props) => (
    <RawLayout title={title}>
        <div className="px-5 py-5 mx-auto flex justify-around">
            <div className="bg-white rounded-lg p-8 w-full mt-0 md:mt-0 shadow-md">
                {children}
            </div>
        </div>
    </RawLayout>
);
