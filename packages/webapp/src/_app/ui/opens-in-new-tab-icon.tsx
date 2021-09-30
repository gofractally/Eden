import { FiArrowUpRight } from "react-icons/fi";

interface Props {
    className?: string;
    size?: number;
}

export const OpensInNewTabIcon = ({ className = "", size = 12 }: Props) => (
    <FiArrowUpRight size={size} className={className} />
);
