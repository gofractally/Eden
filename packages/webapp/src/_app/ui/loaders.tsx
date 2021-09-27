import { FaSpinner } from "react-icons/fa";

import { Card, Container } from "_app";

export const Loader = ({ size = 56 }: { size?: number }) => (
    <div className="w-full h-full flex justify-center items-center">
        <FaSpinner size={size} className="animate-spin mr-2 text-gray-700" />
    </div>
);

export const LoadingCard = () => (
    <Card>
        <Loader />
    </Card>
);

export const LoadingContainer = () => (
    <Container className="py-12">
        <Loader />
    </Container>
);
