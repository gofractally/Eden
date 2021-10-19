import React from "react";
import {
    List,
    ListRowProps,
    WindowScroller,
    WindowScrollerChildProps,
} from "react-virtualized";

import {
    Container,
    SideNavLayout,
    Heading,
    queryNewMembers,
    useMembers,
    LoadingContainer,
    Text,
} from "_app";
import { MemberChip, MemberData } from "members";

// const NEW_MEMBERS_PAGE_SIZE = 10000;

interface Props {
    membersPage: number;
}

export const MembersPage = (props: Props) => {
    // const newMembers = useQuery({
    //     ...queryNewMembers(1, NEW_MEMBERS_PAGE_SIZE),
    // });

    return (
        <SideNavLayout title="Community">
            <Container className="lg:sticky lg:top-0 lg:z-10 bg-white border-b">
                <Heading size={1}>Community</Heading>
            </Container>
            <AllMembers />
        </SideNavLayout>
    );
};

const AllMembers = () => {
    const { data: members, isLoading, isError } = useMembers();

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
        <WindowScroller>
            {({
                height,
                isScrolling,
                onChildScroll,
                scrollTop,
            }: WindowScrollerChildProps) => (
                <List
                    autoHeight
                    autoWidth
                    height={height}
                    isScrolling={isScrolling}
                    onScroll={onChildScroll}
                    rowCount={members.length}
                    rowHeight={77}
                    rowRenderer={({ index, key, style }: ListRowProps) => (
                        <MemberChip
                            member={members[index] as MemberData}
                            key={key}
                            style={style}
                        />
                    )}
                    scrollTop={scrollTop}
                    width={10000}
                />
            )}
        </WindowScroller>
    );
};

export default MembersPage;
