import { Button } from "./button";

interface Props {
    paginate: (increment: number) => void;
    hasNext: boolean;
    hasPrevious: boolean;
}

export const PaginationNav = ({ hasPrevious, hasNext, paginate }: Props) => (
    <div className="mt-4 max-w-md mx-auto text-center space-x-4">
        {hasPrevious && (
            <Button type="neutral" size="sm" onClick={() => paginate(-1)}>
                Previous Page
            </Button>
        )}
        {hasNext && (
            <Button type="neutral" size="sm" onClick={() => paginate(1)}>
                Next Page
            </Button>
        )}
    </div>
);
