import { ActionButton, ActionButtonSize, ActionButtonType, Card } from "_app";

interface Props {
    href?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    buttonLabel: string;
    children: React.ReactNode;
}

export const CallToAction = ({
    href,
    onClick,
    buttonLabel,
    children,
}: Props) => (
    <Card>
        <section className="text-gray-600 body-font">
            <div className="container px-5 py-24 mx-auto">
                <div className="lg:w-2/3 flex flex-col sm:flex-row sm:items-center items-start mx-auto">
                    <h1 className="flex-grow sm:pr-16 text-2xl font-medium title-font text-gray-900">
                        {children}
                    </h1>
                    <ActionButton
                        href={href}
                        onClick={onClick}
                        type={ActionButtonType.DEFAULT}
                        size={ActionButtonSize.L}
                        className="flex-shrink-0 mt-10 sm:mt-0"
                    >
                        {buttonLabel}
                    </ActionButton>
                </div>
            </div>
        </section>
    </Card>
);
