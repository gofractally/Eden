import { FaSpinner } from "react-icons/fa";

import { Card } from "_app";

export const LoadingCard = () => (
    <Card title="Loading...">
        <FaSpinner className="animate-spin mr-2" />
    </Card>
);
