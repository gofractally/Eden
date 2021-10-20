import React from "react";
import { useQuery } from "react-query";
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
    useFormFields,
} from "_app";
import { MemberChip, MemberData } from "members";
import { CircleX, MagnifyingGlass } from "_app/ui/icons";

const NEW_MEMBERS_PAGE_SIZE = 10000;

interface Props {
    membersPage: number;
}

export const MembersPage = (props: Props) => (
    <SideNavLayout title="Community" className="relative">
        <Container className="lg:sticky lg:top-0 lg:z-10 bg-white">
            <Heading size={1}>Community</Heading>
        </Container>
        <AllMembers />
    </SideNavLayout>
);

const AllMembers = () => {
    const newMembers = useQuery({
        ...queryNewMembers(1, NEW_MEMBERS_PAGE_SIZE),
    });

    const allMembers = useMembers();

    const [fields, setFields] = useFormFields({
        memberSearch: "",
    });

    if (newMembers.isLoading || allMembers.isLoading) {
        return <LoadingContainer />;
    }

    if (newMembers.isError || allMembers.isError || !allMembers.data) {
        return (
            <Container className="flex flex-col justify-center items-center py-16 text-center">
                <Heading size={4}>Error loading member information</Heading>
                <Text>Please reload the page to try again.</Text>
            </Container>
        );
    }

    if (!(allMembers.data as MemberData[]).length) {
        return (
            <Container className="flex flex-col justify-center items-center py-16 text-center">
                <Heading size={4}>No members found</Heading>
                <Text>
                    There don't seem to be any members in this community yet.
                </Text>
            </Container>
        );
    }

    const clearSearch = () => {
        setFields({ target: { id: "memberSearch", value: "" } });
    };

    const findMember = (member: MemberData) =>
        member.account.includes(fields.memberSearch.toLowerCase()) ||
        member.name.toLowerCase().includes(fields.memberSearch.toLowerCase());

    const sortMembers = (a: MemberData, b: MemberData) =>
        b.createdAt - a.createdAt;

    const mergeAuctionData = (member: MemberData) => {
        const newMemberRecord = newMembers.data?.find(
            (newMember) => newMember.account === member.account
        );
        return newMemberRecord ?? member;
    };

    let members = (allMembers.data as MemberData[])
        .filter(findMember)
        .sort(sortMembers)
        .map(mergeAuctionData);

    return (
        <>
            <div
                className="xs:hidden sticky z-10 bg-white"
                style={{ top: 53, boxShadow: "0 0 0 1px #e5e5e5" }}
            >
                <MagnifyingGlass
                    size={18}
                    className="text-gray-300 absolute left-3"
                    style={{ top: 19 }}
                />
                <div className="flex items-center">
                    <input
                        id="memberSearch"
                        name="memberSearch"
                        type="text"
                        value={fields.memberSearch}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFields(e)
                        }
                        className="flex-1 h-14 w-full border-none focus:ring-0 placeholder-gray-300 text-lg pl-9"
                        placeholder="find member"
                    />
                    {fields.memberSearch ? (
                        <div
                            className="flex justify-center items-center h-10 px-2.5"
                            onClick={clearSearch}
                        >
                            <CircleX size={18} className="text-gray-400" />
                        </div>
                    ) : null}
                </div>
            </div>
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
                        containerProps={{
                            "data-testid": "members-list",
                        }}
                    />
                )}
            </WindowScroller>
        </>
    );
};

export default MembersPage;
