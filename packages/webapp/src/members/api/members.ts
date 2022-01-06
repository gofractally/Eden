import { devUseFixtureData, edenContractAccount } from "config";
import { getAccountCollection, getAuctions, getTemplates } from "nfts/api";
import {
    AssetData,
    AuctionableTemplateData,
    MemberNFT,
    TemplateData,
} from "nfts/interfaces";

import { fixtureMemberData } from "./fixtures";
import { Member, MemberSocialHandles } from "../interfaces";

export const getMembers = async (
    page: number,
    limit: number,
    ids: string[] = [],
    sortField = "created",
    order = "asc"
): Promise<MemberNFT[]> => {
    if (devUseFixtureData) {
        let data = fixtureMemberData;
        if (ids.length) {
            data = fixtureMemberData.filter((md) =>
                ids.includes(md.templateId!.toString())
            );
        }
        return Promise.resolve(data.slice(0, limit));
    }
    const data = await getTemplates(page, limit, ids, sortField, order);
    return data.map(convertAtomicTemplateToMember);
};

export const getNewMembers = async (
    page?: number,
    limit?: number
): Promise<MemberNFT[]> => {
    const data = await getAuctions(edenContractAccount, undefined, page, limit);
    return data.map(convertAtomicAssetToMemberWithSalesData);
};

export const getCollection = async (account: string): Promise<MemberNFT[]> => {
    const assets = await getAccountCollection(account);
    const members: MemberNFT[] = assets.map(convertAtomicAssetToMember);
    const assetsOnAuction = await getAuctions(account);
    assetsOnAuction
        .map(convertAtomicAssetToMemberWithSalesData)
        .forEach((asset) => members.push(asset));
    return members.sort((a, b) => a.createdAt - b.createdAt);
};

export const memberNFTDefaults: MemberNFT = {
    templateId: 0,
    name: "",
    image: "",
    account: "",
    bio: "",
    socialHandles: {},
    inductionVideo: "",
    attributions: "",
    createdAt: 0,
};

export const memberDefaults: Member = {
    createdAt: 0,
    accountName: "",
    profile: {
        name: "",
        image: {
            cid: "",
            url: "",
            attributions: "",
        },
        bio: "",
        socialHandles: {},
    },
    inductionVideo: {
        cid: "",
        url: "",
    },
    participatingInElection: false,
};

const convertAtomicTemplateToMember = (data: TemplateData): MemberNFT => ({
    ...memberNFTDefaults,
    templateId: parseInt(data.template_id),
    createdAt: parseInt(data.created_at_time),
    name: data.immutable_data.name,
    image: data.immutable_data.img,
    account: data.immutable_data.account,
    bio: data.immutable_data.bio,
    attributions: data.immutable_data.attributions || "",
    inductionVideo: data.immutable_data.video,
    socialHandles: parseSocial(data.immutable_data.social || "{}"),
});

const convertAtomicAssetToMember = (data: AssetData): MemberNFT => ({
    ...convertAtomicTemplateToMember(data.template),
    assetData: {
        assetId: data.asset_id,
        templateMint: parseInt(data.template_mint),
    },
    saleId: data.sales && data.sales.length ? data.sales[0].sale_id : undefined,
});

const convertAtomicAssetToMemberWithSalesData = (
    data: AuctionableTemplateData
): MemberNFT => {
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

const parseSocial = (socialHandlesJsonString: string): MemberSocialHandles => {
    try {
        return JSON.parse(socialHandlesJsonString);
    } catch (e) {
        console.error("fail to parse social handles ", socialHandlesJsonString);
        return {};
    }
};
