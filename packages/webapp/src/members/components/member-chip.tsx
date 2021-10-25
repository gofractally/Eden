import React from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import { blockExplorerAccountBaseUrl } from "config";
import { ROUTES } from "_app/routes";
import { GenericMemberChip, openInNewTab } from "_app";

import { MemberChipTelegramLink, NFTInfo } from "./member-chip-components";
import { MemberData } from "../interfaces";

interface MemberChipProps {
    member: MemberData;
    [x: string]: any;
}

export const MemberChip = ({ member, ...containerProps }: MemberChipProps) => {
    const router = useRouter();

    const onClick = (e: React.MouseEvent) => {
        if (member.account) {
            e.stopPropagation();
            router.push(`${ROUTES.MEMBERS.href}/${member.account}`);
        } else {
            openInNewTab(`${blockExplorerAccountBaseUrl}/${member.name}`);
        }
    };

    return (
        <GenericMemberChip
            member={member}
            onClickChip={onClick}
            contentComponent={
                <MemberDetails member={member} onClick={onClick} />
            }
            {...containerProps}
        />
    );
};

export default MemberChip;

interface MemberDetailsProps {
    member: MemberData;
    onClick?: (e: React.MouseEvent) => void;
}

const MemberDetails = ({ member, onClick }: MemberDetailsProps) => {
    const hasNftInfo = member.auctionData || member.assetData;
    const isNotMember = member.createdAt === 0;
    const formattedJoinDate = dayjs(member.createdAt).format("YYYY.MM.DD");

    return (
        <div onClick={onClick} className="flex-1 flex flex-col justify-center">
            <div className="flex items-center space-x-1 text-xs text-gray-500 font-light">
                {hasNftInfo ? (
                    <NFTInfo member={member} />
                ) : isNotMember ? (
                    <p>not an eden member</p>
                ) : (
                    <p>Joined {formattedJoinDate}</p>
                )}
            </div>
            <p className="hover:underline">{member.name}</p>
            <MemberChipTelegramLink handle={member.socialHandles.telegram} />
        </div>
    );
};
