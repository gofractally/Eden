import { FaStar } from "react-icons/fa";

export const DelegateBadge = ({ size }: { size: number }) => (
    <div
        className="flex justify-center items-center rounded-full border border-yellow-800 bg-yellow-500"
        style={{ padding: size / 3.66 }}
    >
        <FaStar size={size} className="text-white" />
    </div>
);

export default DelegateBadge;
