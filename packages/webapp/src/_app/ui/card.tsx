import { Heading } from "_app/ui";

interface Props {
    title?: string;
    titleSize?: 1 | 2 | 3 | 4;
    children: React.ReactNode;
    className?: string;
}

export const Card = ({ children, title, titleSize = 1, className }: Props) => (
    <div className={`bg-white p-6 md:p-8 w-full ${className || ""}`}>
        {title && (
            <Heading size={titleSize} className="mb-3">
                {title}
            </Heading>
        )}
        {children}
    </div>
);
