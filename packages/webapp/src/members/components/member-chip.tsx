import React from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";

import { atomicAssets, blockExplorerAccountBaseUrl } from "config";
import { ROUTES } from "_app/routes";
import { assetToLocaleString, openInNewTab, useCountdown } from "_app";
import { GenericMemberChip } from "_app/ui";
import { NFT } from "_app/ui/icons";
import { MemberAuctionData } from "members";

import { MemberChipTelegramLink } from "./member-chip-components";
import { AssetData, MemberData } from "../interfaces";

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

const NFTInfo = ({ member }: { member: MemberData }) => {
    if (member.auctionData) {
        return <AuctionBadge auctionData={member.auctionData} />;
    }

    if (!member.assetData) return null;

    if (member.saleId) {
        return (
            <SaleBadge assetData={member.assetData} saleId={member.saleId} />
        );
    }

    return <AssetBadge assetData={member.assetData} />;
};

const AuctionBadge = ({ auctionData }: { auctionData: MemberAuctionData }) => {
    const countdown = useCountdown({
        endTime: new Date(auctionData.bidEndTime as number),
        interval: 30000,
    });

    const goToAuction = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${atomicAssets.hubUrl}/market/auction/${auctionData.auctionId}`;
        openInNewTab(url);
    };

    return (
        <div
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-600 transition"
            onClick={goToAuction}
        >
            <NFT size={17} className="pb-px" />
            {auctionData.price ? (
                <>
                    <p>{assetToLocaleString(auctionData.price, 4)}</p>
                    <p>•</p>
                </>
            ) : null}
            <p>{countdown["d-h-m"] || "auction ended"}</p>
        </div>
    );
};

const SaleBadge = ({
    assetData,
    saleId,
}: {
    assetData: AssetData;
    saleId: string;
}) => (
    <div
        className="flex items-center space-x-1 text-gray-500 hover:text-gray-600 transition"
        onClick={(e) => {
            e.stopPropagation();
            const url = `${atomicAssets.hubUrl}/market/sale/${saleId}`;
            openInNewTab(url);
        }}
    >
        <NFT size={17} className="pb-px" />
        <p>#{assetData.templateMint} ON SALE</p>
    </div>
);

const AssetBadge = ({ assetData }: { assetData: AssetData }) => (
    <div
        onClick={(e) => {
            e.stopPropagation();
            const url = `${atomicAssets.hubUrl}/explorer/asset/${assetData?.assetId}`;
            openInNewTab(url);
        }}
    >
        <NFT
            size={17}
            className="pb-px text-gray-500 hover:text-gray-600 transition"
        />
    </div>
);
