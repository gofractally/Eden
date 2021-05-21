import {
    ActionButton,
    ActionButtonType,
    ActionButtonSize,
} from "./action-button";

interface Props {
    paginate: (increment: number) => void;
    hasNext: boolean;
    hasPrevious: boolean;
}

export const PaginationNav = ({ hasPrevious, hasNext, paginate }: Props) => (
    <div className="mt-4 max-w-md mx-auto text-center space-x-4">
        {hasPrevious && (
            <ActionButton
                type={ActionButtonType.NEUTRAL}
                size={ActionButtonSize.S}
                onClick={() => paginate(-1)}
            >
                Previous Page
            </ActionButton>
        )}
        {hasNext && (
            <ActionButton
                type={ActionButtonType.NEUTRAL}
                size={ActionButtonSize.S}
                onClick={() => paginate(1)}
            >
                Next Page
            </ActionButton>
        )}
    </div>
);
