import React from "react";
import { GetServerSideProps } from "next";
import { QueryClient } from "react-query";
import { dehydrate } from "react-query/hydration";

import {
    Container,
    SideNavLayout,
    Heading,
    queryNewMembers,
    useMembers,
    LoadingContainer,
    Text,
} from "_app";
import { MemberChip, MemberData, VirtualMembersList } from "members";
import { useCommunityWindowInfo } from "members/hooks";

const NEW_MEMBERS_PAGE_SIZE = 10000;

export const getServerSideProps: GetServerSideProps = async () => {
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
    const { isSmallScreen } = useCommunityWindowInfo();

    // const newMembers = useQuery({
    //     ...queryNewMembers(1, NEW_MEMBERS_PAGE_SIZE),
    //     keepPreviousData: true,
    // });

    return (
        <SideNavLayout
            title="Community"
            className="divide-y flex-1 flex flex-col"
            hideFooter={isSmallScreen}
        >
            {!isSmallScreen && <CommunityHeading />}
            <AllMembers />
        </SideNavLayout>
    );
};

const CommunityHeading = () => (
    <Container>
        <Heading size={1}>Community</Heading>
    </Container>
);

const AllMembers = () => {
    const { isSmallScreen, listHeight } = useCommunityWindowInfo();
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
        <div className="flex-1">
            <VirtualMembersList
                members={members as MemberData[]}
                height={listHeight}
                header={isSmallScreen && <CommunityHeading />}
                dataTestId="members-grid"
            >
                {(member) => <MemberChip member={member} />}
            </VirtualMembersList>
        </div>
    );
};

export default MembersPage;
