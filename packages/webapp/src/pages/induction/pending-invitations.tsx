import { useQuery } from "react-query";

import { SingleColLayout, Card, PaginationNav, membersStatsQuery } from "_app";
import { getInductions } from "inductions";
import { useEffect, useState } from "react";
import { SpectatorInductions } from "inductions";

const QUERY_INDUCTIONS = "query_inductions";
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
        [QUERY_INDUCTIONS, lowerBound, upperBound],
        () => getInductions(lowerBound, upperBound, PAGE_SIZE)
    );

    useEffect(() => {
        if (inductions.data && inductions.data.length && !page.firstKey) {
            setPage({ ...page, firstKey: inductions.data[0].id });
        }
    }, [inductions.data]);

    const paginateInductions = (increment: number) => {
        if (!inductions.data) return;

        if (increment > 0) {
            const lastItem = inductions.data[inductions.data.length - 1];
            const boundId = (BigInt(lastItem.id) + 1n).toString();
            console.info(lastItem.id, boundId);
            setPage({ ...page, boundId, isUpper: false });
        } else {
            const firstItem = inductions.data[0];
            const boundId = (BigInt(firstItem.id) - 1n).toString();
            console.info(firstItem.id, boundId);
            setPage({ ...page, boundId, isUpper: true });
        }
    };

    return (
        <SingleColLayout>
            {inductions.isLoading && "Loading pending inductions..."}
            {inductions.error && "Fail to load inductions"}
            {inductions.data && (
                <div className="space-y-4">
                    <SpectatorInductions inductions={inductions.data} />
                    <PaginationNav
                        paginate={paginateInductions}
                        hasNext={inductions.data.length >= PAGE_SIZE}
                        hasPrevious={inductions.data[0].id !== page.firstKey}
                    />
                </div>
            )}
        </SingleColLayout>
    );
};

export default PendingInvitationsPage;
