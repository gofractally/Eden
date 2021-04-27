import React from "react";
import Link from "next/link";

import { atomicAssets, ipfsBaseUrl } from "config";
import { MemberData } from "../interfaces";
import { assetToString } from "_app";

interface Props {
    members: MemberData[];
}

export const MembersGrid = ({ members }: Props) => {
    return (
        <div className={styles.container}>
            {(members.length &&
                members.map((member, index) => (
                    <MemberSquare key={index} member={member} />
                ))) ||
                "No members to list."}
        </div>
    );
};

export const MemberSquare = ({ member }: { member: MemberData }) => (
    <div className="relative">
        {member.edenAccount ? (
            <Link
                href={
                    member.edenAccount ? `/members/${member.edenAccount}` : "#"
                }
            >
                <a>
                    <img
                        src={
                            member.image
                                ? `${ipfsBaseUrl}/${member.image}`
                                : "/images/unknown-member.png"
                        }
                        className={styles.memberImg}
                    />
                </a>
            </Link>
        ) : (
            <img
                src={"/images/unknown-member.png"}
                className={styles.memberImg}
            />
        )}
        <div className={styles.memberNameBadge + " text-xs"}>
            {member.edenAccount ? (
                <Link href={`/members/${member.edenAccount}`}>
                    <a className="text-white hover:underline">{member.name}</a>
                </Link>
            ) : (
                member.name
            )}
        </div>
        {member.assetData && (
            <div className={styles.memberAssetBadge}>
                <a
                    href={`${atomicAssets.hubUrl}/explorer/asset/${member.assetData.assetId}`}
                    target="_blank"
                    className="hover:underline"
                >
                    #{member.assetData.templateMint}
                </a>
            </div>
        )}
        {member.auctionData && (
            <div className={styles.memberAuctionBadge}>
                <a
                    href={`${atomicAssets.hubUrl}/market/auction/${member.auctionData.auctionId}`}
                    className="text-white hover:underline"
                    target="_blank"
                >
                    ⏳ {assetToString(member.auctionData.price, 2)}
                </a>
            </div>
        )}
        {member.saleId && (
            <div className={styles.memberAuctionBadge}>
                <a
                    href={`${atomicAssets.hubUrl}/market/sale/${member.saleId}`}
                    className="text-white hover:underline"
                    target="_blank"
                >
                    ON SALE
                </a>
            </div>
        )}
    </div>
);

const baseBadge =
    "absolute rounded-lg bg-gray-100 bg-gray-100 text-gray-700 p-2 font-bold text-xs";
const styles = {
    container: `grid grid-cols-3 gap-4 max-w-4xl mx-auto p-8`,
    memberImg: `max-h-44 block rounded-md mx-auto`,
    memberNameBadge: `${baseBadge} bottom-2 left-2 bg-yellow-500`,
    memberAssetBadge: `${baseBadge} top-2 right-2`,
    memberAuctionBadge: `${baseBadge} bottom-2 right-2 bg-red-700`,
};
