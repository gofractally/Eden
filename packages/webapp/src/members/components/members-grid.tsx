import React from "react";
import Link from "next/link";
import dayjs from "dayjs";

import { atomicAssets, ipfsUrl } from "config";
import { MemberData } from "../interfaces";
import { assetToString } from "_app";

interface Props {
    members: MemberData[];
    dataTestId?: string;
}

const openInNewTab = (url: string) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
};

export const MembersGrid = ({ members, dataTestId }: Props) => {
    const containerClass = `grid grid-cols-1 max-w-xs sm:max-w-xl md:max-w-none sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mx-auto`;
    return (
        <div className={containerClass} data-testid={dataTestId}>
            {(members.length &&
                members.map((member) => (
                    <MemberSquare key={member.account} member={member} />
                ))) ||
                "No members to list."}
        </div>
    );
};

export const MemberSquare = ({ member }: { member: MemberData }) => {
    const cardClass =
        "group border border-gray-300 rounded-md shadow-md overflow-hidden text-gray-800";
    const memberCard = (
        <div className={cardClass}>
            <MemberImage member={member} />
            <div className="p-3 pt-1">
                <div className="flex items-center space-x-3 mt-1">
                    <MintDate createdAt={member.createdAt} />
                    <AssetBadge member={member} />
                </div>
                <MemberNames member={member} />
                <AuctionBadge member={member} />
                <SaleBadge member={member} />
            </div>
        </div>
    );

    if (member.account) {
        return (
            <Link href={`/members/${member.account}`}>
                <a>{memberCard}</a>
            </Link>
        );
    }
    return memberCard;
};

const baseBadge = "rounded px-2 text-xs";

const MemberImage = ({ member }: { member: MemberData }) => {
    const imageClass = "h-60 md:h-44 w-full object-cover object-center mx-auto";
    if (member.account) {
        return (
            <div className="relative">
                <img
                    src={
                        member.image
                            ? ipfsUrl(member.image)
                            : "/images/unknown-member.png"
                    }
                    className={imageClass}
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition" />
            </div>
        );
    }
    return <img src={"/images/unknown-member.png"} className={imageClass} />;
};

const MintDate = ({ createdAt }: { createdAt: number }) => (
    <div>
        <p className="text-sm text-gray-500">
            {createdAt === 0
                ? "not an eden member"
                : dayjs(createdAt).format("l")}
        </p>
    </div>
);

const AssetBadge = ({ member }: { member: MemberData }) => {
    const assetBadgeClass = `${baseBadge} py-0.5 text-white tracking-wider font-medium bg-gray-500 hover:bg-gray-600 transition`;
    if (member.assetData) {
        return (
            <div
                className={assetBadgeClass}
                onClick={(e) => {
                    e.preventDefault();
                    openInNewTab(
                        `${atomicAssets.hubUrl}/explorer/asset/${member?.assetData?.assetId}`
                    );
                }}
            >
                NFT #{member.assetData.templateMint}
            </div>
        );
    }
    return <></>;
};

const MemberNames = ({ member }: { member: MemberData }) => (
    <div className="tracking-tighter my-1 leading-none">
        {member.account ? (
            <>
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-gray-600">@{member.account}</p>
            </>
        ) : (
            member.name
        )}
    </div>
);

const auctionBadgeClass = `${baseBadge} py-1 text-white font-semibold tracking-wide bg-blue-400 hover:bg-blue-500 transition`;

const AuctionBadge = ({ member }: { member: MemberData }) => {
    if (member.auctionData) {
        return (
            <div className="flex">
                <div
                    className={auctionBadgeClass}
                    onClick={(e) => {
                        e.preventDefault();
                        openInNewTab(
                            `${atomicAssets.hubUrl}/market/auction/${member?.auctionData?.auctionId}`
                        );
                    }}
                >
                    🧑‍⚖️ {assetToString(member.auctionData.price, 2)}
                </div>
            </div>
        );
    }
    return <></>;
};

const SaleBadge = ({ member }: { member: MemberData }) => {
    if (member.saleId) {
        return (
            <div className="flex">
                <div
                    className={auctionBadgeClass}
                    onClick={(e) => {
                        e.preventDefault();
                        openInNewTab(
                            `${atomicAssets.hubUrl}/market/sale/${member.saleId}`
                        );
                    }}
                >
                    ON SALE
                </div>
            </div>
        );
    }
    return <></>;
};
