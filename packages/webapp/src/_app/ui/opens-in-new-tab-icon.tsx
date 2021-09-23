import { FaExternalLinkAlt } from "react-icons/fa";

interface Props {
    className?: string;
    size?: number;
}

export const OpensInNewTabIcon = ({ className = "", size = 10 }: Props) => (
    <FaExternalLinkAlt
        size={size}
        className={`ml-1 text-gray-500 self-start ${className}`}
    />
);
