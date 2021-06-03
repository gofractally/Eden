import { useQuery } from "react-query";

import { SingleColLayout, Card, PaginationNav, membersStatsQuery } from "_app";
import { getInductions } from "inductions";
import { useEffect, useState } from "react";

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
            <Card title="Pending Inductions" titleSize={2}>
                {inductions.isLoading && "Loading pending inductions..."}
                {inductions.error && "Fail to load inductions"}
                {inductions.data && (
                    <>
                        <ul>
                            {inductions.data.map((i) => (
                                <li key={i.id}>
                                    {i.inviter} - {i.invitee}
                                </li>
                            ))}
                        </ul>
                        <PaginationNav
                            paginate={paginateInductions}
                            hasNext={inductions.data.length >= PAGE_SIZE}
                            hasPrevious={
                                inductions.data[0].id !== page.firstKey
                            }
                        />
                    </>
                )}
            </Card>
        </SingleColLayout>
    );
};

export default PendingInvitationsPage;
