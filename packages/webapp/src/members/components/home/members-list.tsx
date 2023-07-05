import React from "react";
import {
    List,
    ListRowProps,
    WindowScroller,
    WindowScrollerChildProps,
} from "react-virtualized";

import { LoadingContainer, MessageContainer } from "_app/ui";
import { Member, MemberChip, useMembersWithAssets } from "members";
import { MemberNFT } from "nfts/interfaces";

const findMember = (
    memberData: { member: Member; nft?: MemberNFT },
    query: string
) =>
    memberData.member.accountName.includes(query.toLowerCase()) ||
    memberData.member.profile.name.toLowerCase().includes(query.toLowerCase());

interface Props {
    searchValue: string;
}

export const MembersList = ({ searchValue }: Props) => {
    const { data, isLoading, isError } = useMembersWithAssets();

    if (isLoading) {
        return <LoadingContainer />;
    }

    if (isError && data.length === 0) {
        return (
            <MessageContainer
                title="Error loading member information"
                message="Please reload the page to try again."
            />
        );
    }

    if (!data.length) {
        return (
            <MessageContainer
                title="No members found"
                message="There don't seem to be any members in this community."
            />
        );
    }

    const members = data.filter((memberData) =>
        findMember(memberData, searchValue)
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
                    rowRenderer={({ index, style }: ListRowProps) => {
                        const { nft, member } = members[index];
                        return (
                            <MemberChip
                                member={nft ?? member}
                                key={nft?.account ?? member.accountName}
                                style={style}
                            />
                        );
                    }}
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
