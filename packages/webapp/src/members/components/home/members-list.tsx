import React from "react";
import {
    List,
    ListRowProps,
    WindowScroller,
    WindowScrollerChildProps,
} from "react-virtualized";

import { useFormFields, useWindowSize } from "_app";
import { LoadingContainer, MessageContainer } from "_app/ui";
import { MemberChip, MemberData, useMembersWithAssets } from "members";
import * as layoutConstants from "_app/layouts/constants";

import CommunityHeader from "./community-header";
import { DesktopMembersSearch, MembersSearch } from "./search-control";

const findMember = (member: MemberData, query: string) =>
    member.account.includes(query.toLowerCase()) ||
    member.name.toLowerCase().includes(query.toLowerCase());

export const MembersList = () => {
    const { width: windowWidth } = useWindowSize();
    const { members: allMembers, isLoading, isError } = useMembersWithAssets();

    const [fields, setFields] = useFormFields({
        memberSearch: "",
    });

    if (isLoading || isError || !allMembers.length) {
        return (
            <div className="divide-y">
                <CommunityHeader />
                {isLoading ? (
                    <LoadingContainer />
                ) : isError ? (
                    <MessageContainer
                        title="Error loading member information"
                        message="Please reload the page to try again."
                    />
                ) : (
                    <MessageContainer
                        title="No members found"
                        message="There don't seem to be any members in this community."
                    />
                )}
            </div>
        );
    }

    const members = allMembers.filter((member) =>
        findMember(member, fields.memberSearch)
    );

    const search = (e: React.ChangeEvent<HTMLInputElement>) => setFields(e);
    const clear = () =>
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
                    onChange={search}
                    onClear={clear}
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
                    onChange={search}
                    onClear={clear}
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
                        noRowsRenderer={() => (
                            <MessageContainer
                                title="No search results"
                                message="No members were found with matching names or accounts. Try modifying your search."
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

export default MembersList;
