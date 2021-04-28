import { atomicAssets, edenContractAccount } from "config";
import {
    getAccountCollection,
    getAuctions,
    getOwners,
    getTemplate,
    getTemplates,
} from "nfts/api";
import {
    AssetData,
    AuctionableTemplateData,
    EdenNftSocialHandles,
    TemplateData,
} from "nfts/interfaces";

import { MemberData } from "../interfaces";
import { getEdenMember } from "./eden-contract";

export const getMember = async (
    edenAccount: string
): Promise<MemberData | undefined> => {
    const member = await getEdenMember(edenAccount);
    if (member && member.nft_template_id > 0) {
        const template = await getTemplate(`${member.nft_template_id}`);
        return template ? convertAtomicTemplateToMember(template) : undefined;
    }
};

export const getMembers = async (
    page = 1,
    limit = 200,
    ids: string[] = [],
    sortField = "created",
    order = "asc"
): Promise<MemberData[]> => {
    const data = await getTemplates(page, limit, ids, sortField, order);
    return data.map(convertAtomicTemplateToMember);
};

export const getNewMembers = async (): Promise<MemberData[]> => {
    const data = await getAuctions(edenContractAccount);
    return data.map(convertAtomicAssetToMemberWithSalesData);
};

export const getCollection = async (
    edenAccount: string
): Promise<MemberData[]> => {
    const assets = await getAccountCollection(edenAccount);
    const members: MemberData[] = assets.map(convertAtomicAssetToMember);
    const assetsOnAuction = await getAuctions(edenAccount);
    assetsOnAuction
        .map(convertAtomicAssetToMemberWithSalesData)
        .forEach((asset) => members.push(asset));
    return members.sort((a, b) => a.createdAt - b.createdAt);
};

export const getCollectedBy = async (
    templateId: number
): Promise<{ members: MemberData[]; unknownOwners: string[] }> => {
    const [owners, auctions] = await Promise.all([
        getOwners(templateId),
        getAuctions(undefined, [`${templateId}`]),
    ]);

    const auctionsOwners = auctions
        .filter((auction) => auction.seller !== edenContractAccount)
        .map((auction) => auction.seller);

    // the real eden owners are the current owners + pending auctions by current owners
    const edenAccs = owners.concat(auctionsOwners);

    // TODO: revisit very expensive lookups here, we need to revisit
    // maybe not, since each card will not be minted more than 20 times...
    // so a given template will have a MAXIMUM number of 20 owners.
    // even though, it would generate 20 api calls... not good.
    const collectedMembers = edenAccs.map(getMember);
    const membersData = await Promise.all(collectedMembers);

    const members = membersData.filter(
        (member) => member !== undefined
    ) as MemberData[];
    const unknownOwners = edenAccs.filter(
        (acc) =>
            acc !== atomicAssets.marketContract &&
            !members.find((member) => member.edenAccount === acc)
    );

    return { members, unknownOwners };
};

const convertAtomicTemplateToMember = (data: TemplateData): MemberData => ({
    templateId: parseInt(data.template_id),
    createdAt: parseInt(data.created_at_time),
    name: data.immutable_data.name,
    image: data.immutable_data.img,
    edenAccount: data.immutable_data.account,
    bio: data.immutable_data.bio,
    inductionVideo: data.immutable_data.video,
    socialHandles: parseSocial(data.immutable_data.social || "{}"),
});

const convertAtomicAssetToMember = (data: AssetData): MemberData => ({
    ...convertAtomicTemplateToMember(data.template),
    assetData: {
        assetId: data.asset_id,
        templateMint: parseInt(data.template_mint),
    },
    saleId: data.sales && data.sales.length ? data.sales[0].sale_id : undefined,
});

const convertAtomicAssetToMemberWithSalesData = (
    data: AuctionableTemplateData
): MemberData => {
    const member = convertAtomicTemplateToMember(data);
    member.assetData = {
        assetId: data.assetId,
        templateMint: data.templateMint,
    };
    if (data.currentBid) {
        member.auctionData = {
            auctionId: data.auctionId,
            price: data.currentBid,
            bidEndTime: data.endTime,
        };
    }
    return member;
};

const parseSocial = (socialHandlesJsonString: string): EdenNftSocialHandles => {
    try {
        return JSON.parse(socialHandlesJsonString);
    } catch (e) {
        console.error("fail to parse social handles ", socialHandlesJsonString);
        return {};
    }
};
