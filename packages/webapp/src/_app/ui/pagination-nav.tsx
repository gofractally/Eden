import { BiLeftArrowAlt, BiRightArrowAlt } from "react-icons/bi";

import { Text } from "./text";

interface Props {
    paginate: (increment: number) => void;
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber?: number;
    totalPages?: number;
}

const PAGE_BUTTON_BASE_CLASS =
    "flex justify-center items-center h-8 w-8 rounded-full cursor-pointer transition bg-gray-100 hover:bg-gray-200 active:bg-gray-300";

export const PaginationNav = ({
    hasPrevious,
    hasNext,
    paginate,
    pageNumber,
    totalPages,
}: Props) => (
    <div className="flex items-center justify-center md:justify-end space-x-3">
        {Boolean(totalPages && pageNumber) && (
            <Text size="sm" className="mr-4">
                Page {pageNumber} of {totalPages}
            </Text>
        )}
        {hasPrevious && (
            <div className={`${PAGE_BUTTON_BASE_CLASS} pl-px`}>
                <BiLeftArrowAlt size={22} onClick={() => paginate(-1)} />
            </div>
        )}
        {hasNext && (
            <div className={PAGE_BUTTON_BASE_CLASS}>
                <BiRightArrowAlt size={22} onClick={() => paginate(1)} />
            </div>
        )}
    </div>
);
