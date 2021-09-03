import { useQuery } from "react-query";

import { SideNavLayout, PaginationNav, queryInductions } from "_app";
import { useEffect, useState } from "react";
import { SpectatorInductions } from "inductions";

const PAGE_SIZE = 10;

export const PendingInvitationsPage = () => {
    const [page, setPage] = useState({
        boundId: "0",
        isUpper: false,
        firstKey: "",
    });

    const lowerBound = !page.isUpper ? page.boundId : undefined;
    const upperBound = page.isUpper ? page.boundId : undefined;
    const inductions = useQuery(
        queryInductions(PAGE_SIZE + 1, lowerBound, upperBound)
    );

    const hasNextPage = Boolean(
        inductions.data && inductions.data.length > PAGE_SIZE
    );
    const displayedData =
        inductions.data && hasNextPage
            ? inductions.data.slice(0, -1)
            : inductions.data || [];

    useEffect(() => {
        if (inductions.data && inductions.data.length && !page.firstKey) {
            setPage({ ...page, firstKey: inductions.data[0]?.id });
        }
    }, [inductions.data]);

    const paginateInductions = (increment: number) => {
        if (!inductions.data) return;

        if (increment > 0) {
            const lastItem = inductions.data[inductions.data.length - 1];
            setPage({ ...page, boundId: lastItem.id, isUpper: false });
        } else {
            const boundId = inductions.data[0].id;
            setPage({ ...page, boundId, isUpper: true });
        }
    };

    return (
        <SideNavLayout>
            {inductions.isLoading && "Loading pending inductions..."}
            {inductions.error && "Fail to load inductions"}
            {inductions.data && (
                <div className="space-y-4">
                    <SpectatorInductions inductions={displayedData} />
                    <PaginationNav
                        paginate={paginateInductions}
                        hasNext={hasNextPage}
                        hasPrevious={inductions.data[0]?.id !== page.firstKey}
                    />
                </div>
            )}
        </SideNavLayout>
    );
};

export default PendingInvitationsPage;
