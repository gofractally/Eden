import { RawLayout } from "./raw-layout";

interface Props {
    title?: string;
    children: React.ReactNode;
}

export const SingleColLayout = ({ children, title }: Props) => (
    <RawLayout title={title}>
        <div className="py-5 flex justify-around">
            <div className="md:bg-white rounded-lg md:p-8 w-full mt-0 md:shadow-md">
                {children}
            </div>
        </div>
    </RawLayout>
);
