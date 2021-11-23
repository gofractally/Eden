import React from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import { blockExplorerAccountBaseUrl } from "config";
import { ROUTES } from "_app/routes";
import { GenericMemberChip, ipfsUrl, openInNewTab } from "_app";

import { MemberChipTelegramLink, NFTInfo } from "./member-chip-components";
import { Member, MemberNFT } from "../interfaces";

const isNFT = (member: Member | MemberNFT): member is MemberNFT =>
    (member as MemberNFT).name !== undefined;

interface MemberChipProps {
    member: Member | MemberNFT;
    [x: string]: any;
}

export const MemberChip = ({ member, ...containerProps }: MemberChipProps) => {
    const router = useRouter();

    let accountName: string;
    let name: string;

    if (isNFT(member)) {
        accountName = member.account;
        name = member.name;
    } else {
        accountName = member.accountName;
        name = member.profile.name;
    }

    const onClick = (e: React.MouseEvent) => {
        if (accountName) {
            e.stopPropagation();
            router.push(`${ROUTES.MEMBERS.href}/${accountName}`);
        } else {
            openInNewTab(`${blockExplorerAccountBaseUrl}/${name}`);
        }
    };

    if (isNFT(member)) {
        return (
            <GenericMemberChip
                imageUrl={ipfsUrl(member.image)}
                onClickChip={onClick}
                contentComponent={
                    <MemberNFTDetails member={member} onClick={onClick} />
                }
                {...containerProps}
            />
        );
    }

    return (
        <GenericMemberChip
            imageUrl={member.profile.image.url}
            onClickChip={onClick}
            contentComponent={
                <MemberDetails member={member} onClick={onClick} />
            }
            {...containerProps}
        />
    );
};

export default MemberChip;

interface MemberNFTDetailsProps {
    member: MemberNFT;
    onClick?: (e: React.MouseEvent) => void;
}

const MemberNFTDetails = ({ member, onClick }: MemberNFTDetailsProps) => {
    const hasNftInfo = member.auctionData || member.assetData;
    const formattedJoinDate = dayjs(member.createdAt).format("YYYY.MM.DD");

    return (
        <div onClick={onClick} className="flex-1 flex flex-col justify-center">
            <div className="flex items-center space-x-1 text-xs text-gray-500 font-light">
                {hasNftInfo ? (
                    <NFTInfo member={member} />
                ) : (
                    <p>Joined {formattedJoinDate}</p>
                )}
            </div>
            <p className="hover:underline">{member.name}</p>
            <MemberChipTelegramLink handle={member.socialHandles.telegram} />
        </div>
    );
};

interface MemberDetailsProps {
    member: Member;
    onClick?: (e: React.MouseEvent) => void;
}

const MemberDetails = ({ member, onClick }: MemberDetailsProps) => {
    const isNotMember = member.createdAt === 0;
    const formattedJoinDate = dayjs(member.createdAt).format("YYYY.MM.DD");

    return (
        <div onClick={onClick} className="flex-1 flex flex-col justify-center">
            <div className="flex items-center space-x-1 text-xs text-gray-500 font-light">
                {isNotMember ? (
                    <p>not an eden member</p>
                ) : (
                    <p>Joined {formattedJoinDate}</p>
                )}
            </div>
            <p className="hover:underline">{member.profile.name}</p>
            <MemberChipTelegramLink
                handle={member.profile.socialHandles.telegram}
            />
        </div>
    );
};
