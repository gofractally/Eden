import { ActionButton, ActionButtonSize, Card } from "_app";

interface Props {
    buttonLabel?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    href?: string;
    target?: string;
    isExternal?: boolean;
    children: React.ReactNode;
}

export const CallToAction = ({
    href,
    onClick,
    buttonLabel,
    children,
    target,
    isExternal,
}: Props) => (
    <Card>
        <section className="text-gray-600 body-font">
            <div className="container px-5 py-24 mx-auto">
                {href || onClick ? (
                    <div className="lg:w-2/3 flex flex-col sm:flex-row sm:items-center items-start mx-auto">
                        <h1 className="flex-grow sm:pr-16 text-2xl font-medium title-font text-gray-900">
                            {children}
                        </h1>
                        <ActionButton
                            href={href}
                            onClick={onClick}
                            size={ActionButtonSize.L}
                            className="flex-shrink-0 mt-10 sm:mt-0"
                            target={target}
                            isExternal={isExternal}
                        >
                            {buttonLabel || "Go"}
                        </ActionButton>
                    </div>
                ) : (
                    <div className="lg:w-4/5 flex flex-col sm:flex-row sm:items-center items-start mx-auto">
                        <h1 className="flex-grow sm:pr-16 text-2xl font-medium title-font text-gray-900">
                            {children}
                        </h1>
                    </div>
                )}
            </div>
        </section>
    </Card>
);
