import { CSSProperties } from "react";

interface Props {
    children: React.ReactNode;
    darkBg?: boolean;
    onClick?: () => void;
    className?: string;
    style?: CSSProperties;
}

export const Container = ({
    children,
    darkBg,
    onClick,
    className = "",
    style,
}: Props) => (
    <div
        className={`px-2.5 py-5 sm:px-5 ${
            darkBg ? "bg-gray-50" : ""
        } ${className}`}
        onClick={onClick}
        style={style}
    >
        {children}
    </div>
);
