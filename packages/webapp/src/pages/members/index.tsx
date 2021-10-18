import React from "react";
import { GetServerSideProps } from "next";
import { QueryClient } from "react-query";
import { dehydrate } from "react-query/hydration";
import { useVirtual } from "react-virtual";

import {
    Container,
    SideNavLayout,
    Heading,
    queryNewMembers,
    useMembers,
    LoadingContainer,
    Text,
    useWindowSize,
} from "_app";
import { MemberChip, MemberData } from "members";

const NEW_MEMBERS_PAGE_SIZE = 10000;

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const queryClient = new QueryClient();

    await Promise.all([
        queryClient.prefetchQuery(queryNewMembers(1, NEW_MEMBERS_PAGE_SIZE)),
    ]);

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
    };
};

interface Props {
    membersPage: number;
}

export const MembersPage = (props: Props) => {
    const { height } = useWindowSize();
    // const newMembers = useQuery({
    //     ...queryNewMembers(1, NEW_MEMBERS_PAGE_SIZE),
    //     keepPreviousData: true,
    // });

    return (
        <SideNavLayout
            title="Community"
            className="divide-y flex-1 flex flex-col"
        >
            <Container>
                <Heading size={1}>Community</Heading>
            </Container>
            <div className="flex-1">
                <AllMembers height={height} />
            </div>
        </SideNavLayout>
    );
};

const AllMembers = ({ height = 0 }: { height?: number }) => {
    const parentRef = React.useRef<HTMLDivElement>(null);
    const { data: members, isLoading, isError } = useMembers();

    const HEADER_HEIGHT = 77;
    const FOOTER_HEIGHT = 205;

    const rowVirtualizer = useVirtual({
        size: members.length,
        parentRef,
        estimateSize: React.useCallback(() => 77, []),
        overscan: 10,
        paddingEnd: 40,
    });

    if (isLoading) {
        return <LoadingContainer />;
    }

    if (isError || !members) {
        return (
            <Container className="flex flex-col justify-center items-center py-16 text-center">
                <Heading size={4}>Error loading member information</Heading>
                <Text>Please reload the page to try again.</Text>
            </Container>
        );
    }

    if (!(members as MemberData[]).length) {
        return (
            <Container className="flex flex-col justify-center items-center py-16 text-center">
                <Heading size={4}>No members found</Heading>
                <Text>
                    There don't seem to be any members in this community yet.
                </Text>
            </Container>
        );
    }

    return (
        <div
            ref={parentRef}
            className="overflow-auto"
            style={{
                height: height - HEADER_HEIGHT - FOOTER_HEIGHT,
            }}
        >
            <VirtualizedMembersGrid
                members={members as MemberData[]}
                rowVirtualizer={rowVirtualizer}
                dataTestId="members-grid"
            />
        </div>
    );
};

export default MembersPage;

interface VirtualizedProps {
    dataTestId?: string;
    members: MemberData[];
    rowVirtualizer: ReturnType<typeof useVirtual>;
}

export const VirtualizedMembersGrid = ({
    members,
    rowVirtualizer,
    dataTestId,
}: VirtualizedProps) => {
    return (
        <div
            className="w-full relative"
            data-testid={dataTestId}
            style={{
                height: `${rowVirtualizer.totalSize}px`,
            }}
        >
            {rowVirtualizer.virtualItems.map((item) => (
                <div
                    key={item.index}
                    className="absolute top-0 left-0 w-full"
                    style={{
                        height: `${item.size}px`,
                        transform: `translateY(${item.start}px)`,
                    }}
                >
                    <MemberChip member={members[item.index]} />
                </div>
            ))}
        </div>
    );
};
