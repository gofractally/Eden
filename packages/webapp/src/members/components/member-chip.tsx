import { useRouter } from "next/router";
import dayjs from "dayjs";
import { FaGavel } from "react-icons/fa";

import { atomicAssets, blockExplorerAccountBaseUrl } from "config";
import { assetToString, ipfsUrl } from "_app";
import { ROUTES } from "_app/config";

import { MemberData } from "../interfaces";

const openInNewTab = (url: string) => {
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
};

interface Props {
    children?: React.ReactNode;
    member: MemberData;
    onClickChip?: (e: React.MouseEvent) => void;
    onClickProfileImage?: (e: React.MouseEvent) => void;
}

export const MemberChip = ({
    member,
    onClickChip,
    onClickProfileImage,
    children,
}: Props) => {
    const router = useRouter();

    const onClickMember = (e: React.MouseEvent) => {
        if (!member.account) return undefined;
        e.stopPropagation();
        router.push(`${ROUTES.MEMBERS.href}/${member.account}`);
    };

    const memberChip = (
        <div
            className="relative flex items-center justify-between p-2.5 bg-white hover:bg-gray-100 active:bg-gray-200 transition select-none cursor-pointer"
            style={{ boxShadow: "0 0 0 1px #e5e5e5" }}
            onClick={onClickChip ?? onClickMember}
        >
            <div className="flex space-x-2.5">
                <MemberImage
                    member={member}
                    onClick={onClickProfileImage ?? onClickMember}
                />
                <div
                    onClick={member.account ? onClickMember : undefined}
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
            </div>
            {children}
        </div>
    );

    if (member.account) {
        return memberChip;
    }

    return (
        <a
            href={`${blockExplorerAccountBaseUrl}/${member.name}`}
            target="_blank"
            rel="noopener noreferrer"
        >
            {memberChip}
        </a>
    );
};

export const MemberChipNFTBadges = ({ member }: { member: MemberData }) => (
    <div className="absolute right-0 bottom-0 p-2.5 space-y-0.5">
        <AuctionBadge member={member} />
        <SaleBadge member={member} />
        {!member.auctionData && !member.saleId && (
            <AssetBadge member={member} />
        )}
    </div>
);

interface MemberImageProps {
    member: MemberData;
    onClick?: (e: React.MouseEvent) => void;
}

const MemberImage = ({ member, onClick }: MemberImageProps) => {
    const imageClass = "rounded-full h-14 w-14 object-cover shadow";
    if (member.account && member.image) {
        return (
            <div className="relative group" onClick={onClick}>
                <img src={ipfsUrl(member.image)} className={imageClass} />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition rounded-full" />
            </div>
        );
    }
    return <img src={"/images/unknown-member.png"} className={imageClass} />;
};

const AssetBadge = ({ member }: { member: MemberData }) => {
    if (member.assetData) {
        return (
            <div
                className="group flex justify-end items-center space-x-1"
                onClick={(e) => {
                    e.preventDefault();
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
    }
    return <></>;
};

const AuctionBadge = ({ member }: { member: MemberData }) => {
    if (member.auctionData) {
        return (
            <div
                className="group flex justify-end items-center space-x-1"
                onClick={(e) => {
                    e.preventDefault();
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
                    {assetToString(member.auctionData.price, 2)} (#
                    {member.assetData?.templateMint})
                </p>
            </div>
        );
    }

    return <></>;
};

const SaleBadge = ({ member }: { member: MemberData }) => {
    if (member.saleId) {
        return (
            <div
                className="group flex justify-end items-center space-x-1"
                onClick={(e) => {
                    e.preventDefault();
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
    }
    return <></>;
};

export default MemberChip;
