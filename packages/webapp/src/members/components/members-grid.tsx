import React from "react";
import Link from "next/link";
import dayjs from "dayjs";
import * as localizedFormat from "dayjs/plugin/localizedFormat";

import { atomicAssets, ipfsBaseUrl } from "config";
import { MemberData } from "../interfaces";
import { assetToString } from "_app";

dayjs.extend(localizedFormat.default);

interface Props {
    members: MemberData[];
}

export const MembersGrid = ({ members }: Props) => {
    const containerClass = `grid grid-cols-1 max-w-xs sm:max-w-xl md:max-w-none sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mx-auto`;
    return (
        <div className={containerClass}>
            {(members.length &&
                members.map((member, index) => (
                    <MemberSquare key={index} member={member} />
                ))) ||
                "No members to list."}
        </div>
    );
};

export const MemberSquare = ({ member }: { member: MemberData }) => (
    <div className="text-gray-800">
        <MemberImage member={member} />
        <div className="flex items-center space-x-3 mt-1">
            <MintDate createdAt={member.createdAt} />
            <AssetBadge member={member} />
        </div>
        <MemberNames member={member} />
        <AuctionBadge member={member} />
        <SaleBadge member={member} />
    </div>
);

const baseBadge = "rounded px-2 text-xs";

const MemberImage = ({ member }: { member: MemberData }) => {
    const imageClass =
        "h-40 sm:h-32 w-full object-cover object-top rounded mx-auto border border-gray-300 shadow";
    if (member.account) {
        return (
            <Link href={member.account ? `/members/${member.account}` : "#"}>
                <div className="relative">
                    <a>
                        <img
                            src={
                                member.image
                                    ? `${ipfsBaseUrl}/${member.image}`
                                    : "/images/unknown-member.png"
                            }
                            className={imageClass}
                        />
                    </a>
                    <div className="absolute inset-0 bg-black rounded opacity-0 hover:opacity-20 transition cursor-pointer" />
                </div>
            </Link>
        );
    }
    return <img src={"/images/unknown-member.png"} className={imageClass} />;
};

const MintDate = ({ createdAt }: { createdAt: number }) => (
    <div>
        <p className="text-sm text-gray-500">{dayjs(createdAt).format("l")}</p>
    </div>
);

const AssetBadge = ({ member }: { member: MemberData }) => {
    const assetBadgeClass = `${baseBadge} py-0.5 text-white tracking-wider font-medium bg-gray-500 hover:bg-gray-600 transition`;
    if (member.assetData) {
        return (
            <a
                href={`${atomicAssets.hubUrl}/explorer/asset/${member.assetData.assetId}`}
                target="_blank"
            >
                <div className={assetBadgeClass}>
                    NFT #{member.assetData.templateMint}
                </div>
            </a>
        );
    }
    return <></>;
};

const MemberNames = ({ member }: { member: MemberData }) => (
    <div className="tracking-tighter my-1 leading-none">
        {member.account ? (
            <>
                <Link href={`/members/${member.account}`}>
                    <a className="font-medium hover:underline">{member.name}</a>
                </Link>
                <p className="text-sm text-gray-600">@{member.account}</p>
            </>
        ) : (
            member.name
        )}
    </div>
);

const AuctionBadge = ({ member }: { member: MemberData }) => {
    const auctionBadgeClass = `${baseBadge} py-1 text-white font-semibold tracking-wide bg-blue-400 hover:bg-blue-500 transition`;
    if (member.auctionData) {
        return (
            <div className="flex align-start">
                <a
                    href={`${atomicAssets.hubUrl}/market/auction/${member.auctionData.auctionId}`}
                    target="_blank"
                >
                    <div className={auctionBadgeClass}>
                        🧑‍⚖️ {assetToString(member.auctionData.price, 2)}
                    </div>
                </a>
            </div>
        );
    }
    return <></>;
};

const SaleBadge = ({ member }: { member: MemberData }) => {
    if (member.saleId) {
        return (
            <a
                href={`${atomicAssets.hubUrl}/market/sale/${member.saleId}`}
                target="_blank"
            >
                <div className={styles.memberAuctionBadge}>ON SALE</div>
            </a>
        );
    }
    return <></>;
};
