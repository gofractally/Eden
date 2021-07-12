interface Props {
    children: React.ReactNode;
    className?: string;
}

export const Container = ({ children, className = "" }: Props) => (
    <div className={`p-2.5 ${className}`}>{children}</div>
);
