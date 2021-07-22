interface Props {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const Container = ({ children, onClick, className = "" }: Props) => (
    <div className={`p-2.5 ${className}`} onClick={onClick}>
        {children}
    </div>
);
