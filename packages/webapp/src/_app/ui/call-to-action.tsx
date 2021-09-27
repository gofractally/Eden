import { Button } from "_app";

interface Props {
    buttonLabel?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    href?: string;
    target?: string;
    isExternal?: boolean;
    dataTestId?: string;
    children: React.ReactNode;
}

export const CallToAction = ({
    href,
    onClick,
    buttonLabel,
    children,
    target,
    isExternal,
    dataTestId,
}: Props) => (
    <section className="text-gray-600 body-font">
        <div className="container px-5 py-24 mx-auto">
            {href || onClick ? (
                <div className="lg:w-3/4 flex flex-col sm:flex-row sm:items-center items-start mx-auto">
                    <h1 className="flex-grow sm:pr-16 text-2xl font-medium title-font text-gray-900">
                        {children}
                    </h1>
                    <Button
                        href={href}
                        onClick={onClick}
                        size="lg"
                        className="flex-shrink-0 mt-10 sm:mt-0"
                        target={target}
                        isExternal={isExternal}
                        dataTestId={dataTestId}
                    >
                        {buttonLabel || "Go"}
                    </Button>
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
);
