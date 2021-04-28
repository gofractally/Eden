import NextLink from "next/link";

interface Props {
    href: string;
    className?: string;
    lightText?: boolean;
    children: React.ReactNode;
}

export const InductionActionButton = ({
    href,
    className = "",
    lightText = false,
    children,
}: Props) => {
    const baseClass =
        "w-full items-center text-center py-1.5 border rounded text-sm focus:outline-none";
    const labelColor = lightText ? "text-white" : "";
    const buttonClass = `${baseClass} ${labelColor} ${className}`;
    return (
        <NextLink href={href}>
            <a className={buttonClass}>{children}</a>
        </NextLink>
    );
};
