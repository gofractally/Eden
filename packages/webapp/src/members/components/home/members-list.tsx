import React from "react";
import {
    List,
    ListRowProps,
    WindowScroller,
    WindowScrollerChildProps,
} from "react-virtualized";

import { LoadingContainer, MessageContainer } from "_app/ui";
import { MemberChip, MemberNFT, useMembersWithAssets } from "members";

const findMember = (member: MemberNFT, query: string) =>
    member.account.includes(query.toLowerCase()) ||
    member.name.toLowerCase().includes(query.toLowerCase());

interface Props {
    searchValue: string;
}

export const MembersList = ({ searchValue }: Props) => {
    const { members: allMembers, isLoading, isError } = useMembersWithAssets();

    if (isLoading) {
        return <LoadingContainer />;
    }

    if (isError) {
        return (
            <MessageContainer
                title="Error loading member information"
                message="Please reload the page to try again."
            />
        );
    }

    if (!allMembers.length) {
        return (
            <MessageContainer
                title="No members found"
                message="There don't seem to be any members in this community."
            />
        );
    }

    const members = allMembers.filter((member) =>
        findMember(member, searchValue)
    );

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
                    rowRenderer={({ index, style }: ListRowProps) => (
                        <MemberChip
                            member={members[index]}
                            key={members[index].account}
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
    );
};

export default MembersList;
