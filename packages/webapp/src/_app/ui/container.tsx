interface Props {
    children: React.ReactNode;
    darkBg?: boolean;
    onClick?: () => void;
    className?: string;
}

export const Container = ({
    children,
    darkBg,
    onClick,
    className = "",
}: Props) => (
    <div
        className={`p-2.5 ${darkBg ? "bg-gray-100" : ""} ${className}`}
        onClick={onClick}
    >
        {children}
    </div>
);
