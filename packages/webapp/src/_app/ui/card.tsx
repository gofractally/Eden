import { Heading } from "_app/ui";

interface Props {
    title?: string;
    titleSize?: 1 | 2 | 3 | 4;
    children: React.ReactNode;
}

export const Card = ({ children, title, titleSize = 1 }: Props) => (
    <div className="bg-white mb-5 p-6 md:p-8 w-full">
        {title && (
            <Heading size={titleSize} className="mb-3">
                {title}
            </Heading>
        )}
        {children}
    </div>
);
