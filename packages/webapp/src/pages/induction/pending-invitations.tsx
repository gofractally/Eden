import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import { SingleColLayout, Card, PaginationNav, membersStatsQuery } from "_app";
import { getInductions } from "inductions";

const QUERY_INDUCTIONS = "query_inductions";
const PAGE_SIZE = 2;

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const queryClient = new QueryClient();

    const page = (query.page as string) || "0";
    const isUpper = (query.isUpper as string) === "true";

    const lowerBound = isUpper ? undefined : page;
    const upperBound = isUpper ? page : undefined;

    await Promise.all([
        queryClient.prefetchQuery(membersStatsQuery),
        queryClient.prefetchQuery([QUERY_INDUCTIONS, page], () =>
            getInductions(lowerBound, upperBound, PAGE_SIZE)
        ),
    ]);

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
            page,
            isUpper,
        },
    };
};

interface Props {
    page: string;
    isUpper: boolean;
}

export const PendingInvitationsPage = ({ page, isUpper }: Props) => {
    const router = useRouter();
    console.info("pros page >>>", page);
    // const [page, setPage] = useState(props.page);

    const lowerBound = isUpper ? undefined : page;
    const upperBound = isUpper ? page : undefined;

    const { data: memberStats } = useQuery({
        ...membersStatsQuery,
        keepPreviousData: true,
    });
    const totalPages =
        memberStats && Math.ceil(memberStats.pending_members / PAGE_SIZE);

    const inductions = useQuery(
        [QUERY_INDUCTIONS, lowerBound, upperBound],
        () => getInductions(lowerBound, upperBound, PAGE_SIZE),
        { keepPreviousData: true }
    );

    const paginateInductions = (increment: number) => {
        if (!inductions.data) return;

        let page = "";
        let isUpper = false;
        if (increment > 0) {
            const lastItem = inductions.data[inductions.data.length - 1];
            const lowerBound = (BigInt(lastItem.id) + 1n).toString();
            console.info(lastItem.id, lowerBound);
            page = lowerBound;
        } else {
            const firstItem = inductions.data[0];
            const upperBound = (BigInt(firstItem.id) - 1n).toString();
            console.info(firstItem.id, upperBound);
            page = upperBound;
            isUpper = true;
        }

        router.push(
            {
                query: { page, isUpper },
            },
            undefined,
            { scroll: false }
        );
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
                            hasPrevious={page !== "0"}
                        />
                    </>
                )}
            </Card>
        </SingleColLayout>
    );
};

export default PendingInvitationsPage;
