import React from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { FaGavel } from "react-icons/fa";

import { atomicAssets, blockExplorerAccountBaseUrl } from "config";
import { assetToLocaleString, openInNewTab } from "_app";
import { GenericMemberChip } from "_app/ui";
import { ROUTES } from "_app/config";

import { MemberData } from "../interfaces";

export const MemberChip = ({ member }: { member: MemberData }) => {
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
            actionComponent={<MemberChipNFTBadges member={member} />}
        />
    );
};

interface MemberDetailsProps {
    member: MemberData;
    onClick?: (e: React.MouseEvent) => void;
}

export const MemberDetails = ({ member, onClick }: MemberDetailsProps) => (
    <div
        onClick={onClick}
        className="flex-1 flex flex-col justify-center group"
    >
        <p className="text-xs text-gray-500 font-light">
            {member.createdAt === 0
                ? "not an eden member"
                : dayjs(member.createdAt).format("YYYY.MM.DD")}
        </p>
        <p className="group-hover:underline">{member.name}</p>
        {member.account && (
            <p className="text-xs text-gray-500 font-light">
                @{member.account}
            </p>
        )}
    </div>
);

export const MemberChipNFTBadges = ({ member }: { member: MemberData }) => (
    <div className="absolute right-0 bottom-0 p-2.5 space-y-0.5">
        <AuctionBadge member={member} />
        <SaleBadge member={member} />
        {!member.auctionData && !member.saleId && (
            <AssetBadge member={member} />
        )}
    </div>
);

const AssetBadge = ({ member }: { member: MemberData }) => {
    if (!member.assetData) return <></>;
    return (
        <div
            className="group flex justify-end items-center space-x-1"
            onClick={(e) => {
                e.stopPropagation();
                openInNewTab(
                    `${atomicAssets.hubUrl}/explorer/asset/${member?.assetData?.assetId}`
                );
            }}
        >
            <p className="text-sm tracking-tight leading-none p-t-px group-hover:underline">
                NFT #{member.assetData.templateMint}
            </p>
        </div>
    );
};

const AuctionBadge = ({ member }: { member: MemberData }) => {
    if (!member.auctionData) return <></>;
    return (
        <div
            className="group flex justify-end items-center space-x-1"
            onClick={(e) => {
                e.stopPropagation();
                openInNewTab(
                    `${atomicAssets.hubUrl}/market/auction/${member?.auctionData?.auctionId}`
                );
            }}
        >
            <FaGavel
                size={14}
                className="text-gray-600 group-hover:text-gray-800"
            />
            <p className="text-sm tracking-tight leading-none p-t-px group-hover:underline">
                {assetToLocaleString(member.auctionData.price, 2)} (#
                {member.assetData?.templateMint})
            </p>
        </div>
    );
};

const SaleBadge = ({ member }: { member: MemberData }) => {
    if (!member.saleId) return <></>;
    return (
        <div
            className="group flex justify-end items-center space-x-1"
            onClick={(e) => {
                e.stopPropagation();
                openInNewTab(
                    `${atomicAssets.hubUrl}/market/sale/${member.saleId}`
                );
            }}
        >
            <p className="text-sm tracking-tight leading-none p-t-px group-hover:underline">
                ON SALE (#
                {member.assetData?.templateMint})
            </p>
        </div>
    );
};

export default MemberChip;
