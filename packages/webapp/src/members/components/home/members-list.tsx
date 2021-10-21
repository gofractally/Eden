import React from "react";
import {
    List,
    ListRowProps,
    WindowScroller,
    WindowScrollerChildProps,
} from "react-virtualized";

import { useFormFields } from "_app";
import { LoadingContainer, MessageContainer, PageHeader } from "_app/ui";
import { MemberChip, MemberData, useMembersWithAssets } from "members";

import { CommunityHeadersWithSearch } from "./search-controls";

const findMember = (member: MemberData, query: string) =>
    member.account.includes(query.toLowerCase()) ||
    member.name.toLowerCase().includes(query.toLowerCase());

export const MembersList = () => {
    const { members: allMembers, isLoading, isError } = useMembersWithAssets();

    const [fields, setFields] = useFormFields({
        memberSearch: "",
    });

    if (isLoading || isError || !allMembers.length) {
        return (
            <div className="divide-y">
                <PageHeader header="Community" />
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
            <CommunityHeadersWithSearch
                id="memberSearch"
                value={fields.memberSearch}
                onChange={search}
                onClear={clear}
            />
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
