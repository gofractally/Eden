import { Button } from "./button";
import { Text } from "./text";

interface Props {
    paginate: (increment: number) => void;
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber?: number;
    totalPages?: number;
}

export const PaginationNav = ({
    hasPrevious,
    hasNext,
    paginate,
    pageNumber,
    totalPages,
}: Props) => (
    <div className="flex items-center justify-center mt-4 max-w-md mx-auto text-center space-x-4">
        {hasPrevious && (
            <Button type="neutral" size="sm" onClick={() => paginate(-1)}>
                Previous Page
            </Button>
        )}
        {Boolean(totalPages && pageNumber) && (
            <Text>
                Page {pageNumber} of {totalPages}
            </Text>
        )}
        {hasNext && (
            <Button type="neutral" size="sm" onClick={() => paginate(1)}>
                Next Page
            </Button>
        )}
    </div>
);
