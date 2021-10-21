import React, { CSSProperties } from "react";
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
    useWindowSize,
    useFocus,
} from "_app";
import { MemberChip, MemberData } from "members";
import { CircleX, MagnifyingGlass } from "_app/ui/icons";
import * as layoutConstants from "_app/layouts/constants";

const NEW_MEMBERS_PAGE_SIZE = 10000;

interface Props {
    membersPage: number;
}

export const MembersPage = (props: Props) => (
    <SideNavLayout title="Community" className="relative">
        <AllMembers />
    </SideNavLayout>
);

interface CommunityHeaderProps {
    className?: string;
    style?: CSSProperties;
    children?: React.ReactNode;
}

const CommunityHeader = ({
    className = "",
    style,
    children,
}: CommunityHeaderProps) => (
    <Container className={className} style={style}>
        <Heading size={1}>Community</Heading>
        {children}
    </Container>
);

interface SearchProps {
    onClear: () => void;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    [x: string]: any;
}

const DesktopMembersSearch = ({ onClear, ...inputProps }: SearchProps) => (
    <div className="h-14 relative hidden lg:flex justify-end flex-1 max-w-md overflow-hidden">
        <div className={`search-expander ${inputProps.value && "expanded"}`}>
            <MembersSearch onClear={onClear} {...inputProps} />
        </div>
        <style jsx>{`
            .search-expander {
                position: absolute;
                transition: width 0.5s ease;
                width: 32px;
                overflow: hidden;
            }
            .search-expander:focus-within {
                width: 100%;
            }
            .search-expander.expanded {
                width: 100%;
            }
        `}</style>
    </div>
);

const MembersSearch = ({ onClear, ...inputProps }: SearchProps) => {
    const [inputRef, setInputFocus] = useFocus<HTMLInputElement>();
    return (
        <div
            className={`flex-1 flex items-center pl-2.5 text-gray-300 focus-within:text-gray-400 transition-colors ${
                inputProps.value && "text-gray-400"
            }`}
        >
            <div
                className="py-2.5 hover:text-gray-400 cursor-pointer"
                onClick={() => setInputFocus({ preventScroll: true })}
            >
                <MagnifyingGlass size={18} />
            </div>
            <input
                id="memberSearch"
                name="memberSearch"
                type="text"
                autoComplete="off"
                className="flex-1 h-14 focus:ring-0 border-none placeholder-gray-300 text-lg"
                placeholder="find member"
                ref={inputRef}
                {...inputProps}
            />
            {inputProps.value ? (
                <div
                    className="flex items-center p-2.5 text-gray-400 hover:text-gray-500 cursor-pointer"
                    onClick={onClear}
                >
                    <CircleX size={18} />
                </div>
            ) : null}
        </div>
    );
};

const AllMembers = () => {
    const { width: windowWidth } = useWindowSize();
    const newMembers = useQuery({
        ...queryNewMembers(1, NEW_MEMBERS_PAGE_SIZE),
    });

    const allMembers = useMembers();

    const [fields, setFields] = useFormFields({
        memberSearch: "",
    });

    if (newMembers.isLoading || allMembers.isLoading) {
        return (
            <div className="divide-y">
                <CommunityHeader />
                <LoadingContainer />
            </div>
        );
    }

    if (newMembers.isError || allMembers.isError || !allMembers.data) {
        return (
            <div className="divide-y">
                <CommunityHeader />
                <Container className="flex flex-col justify-center items-center py-16 text-center">
                    <Heading size={4}>Error loading member information</Heading>
                    <Text>Please reload the page to try again.</Text>
                </Container>
            </div>
        );
    }

    if (!(allMembers.data as MemberData[]).length) {
        return (
            <div className="divide-y">
                <CommunityHeader />
                <Container className="flex flex-col justify-center items-center py-16 text-center">
                    <Heading size={4}>No members found</Heading>
                    <Text>
                        There don't seem to be any members in this community
                        yet.
                    </Text>
                </Container>
            </div>
        );
    }

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

    const setSearch = (e: React.ChangeEvent<HTMLInputElement>) => setFields(e);
    const clearSearch = () =>
        setFields({ target: { id: "memberSearch", value: "" } });

    return (
        <>
            <CommunityHeader
                className="lg:sticky lg:top-0 lg:z-10 flex items-center justify-between bg-white border-b"
                style={{
                    height: 76,
                    paddingTop: 0,
                    paddingBottom: 0,
                }}
            >
                <DesktopMembersSearch
                    value={fields.memberSearch}
                    onChange={setSearch}
                    onClear={clearSearch}
                />
            </CommunityHeader>
            <div
                className="lg:hidden sticky z-10 bg-white"
                style={{
                    boxShadow: "0 0 0 1px #e5e5e5",
                    top:
                        (windowWidth ?? 0) < layoutConstants.breakpoints.xs
                            ? layoutConstants.navigation.mobileTopNavHeight - 1
                            : 0,
                }}
            >
                <MembersSearch
                    value={fields.memberSearch}
                    onChange={setSearch}
                    onClear={clearSearch}
                />
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
                        rowRenderer={({ index, style }: ListRowProps) => (
                            <MemberChip
                                member={members[index] as MemberData}
                                key={(members[index] as MemberData).account}
                                style={style}
                            />
                        )}
                        scrollTop={scrollTop}
                        width={10000}
                        className="outline-none"
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
