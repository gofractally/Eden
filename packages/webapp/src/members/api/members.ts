import { getAccountCollection, getOwners, getTemplates } from "nfts/api";
import { EdenNftSocialHandles } from "nfts/interfaces";
import { MemberData } from "../interfaces";

export const getMember = async (
    edenAccount: string
): Promise<MemberData | undefined> => {
    // TODO: revisit
    // to lookup for a member template we need to read the whole edenAccount
    // collection and then filter itself (we don't have an easier way to lookup
    // from the `edenacc` field on the immutable data of the NFT)
    const members = await getCollection(edenAccount);
    return members.find((member) => member.edenAccount === edenAccount);
};

export const getMembers = async (
    page = 1,
    limit = 20,
    ids: string[] = [],
    sortField = "created",
    order = "asc"
): Promise<MemberData[]> => {
    const data = await getTemplates(page, limit, ids, sortField, order);
    return data.map(convertAtomicAssetToMember);
};

export const getCollection = async (
    edenAccount: string
): Promise<MemberData[]> => {
    const { templates } = await getAccountCollection(edenAccount);

    const templateIds: string[] = templates.map(
        (template: any) => template.template_id
    );
    if (templateIds.length === 0) {
        return [];
    }

    return getMembers(1, 9999, templateIds);
};

export const getCollectedBy = async (
    templateId: number
): Promise<MemberData[]> => {
    const edenAccs: string[] = await getOwners(templateId);

    // TODO: very expensive lookups here, we need to revisit
    // maybe not, since each card will not be minted more than 20 times...
    // so a given template will have a MAXIMUM number of 20 owners.
    // even though, it would generate 20 api calls... not good.
    const collectedMembers = edenAccs.map(getMember);
    const members = await Promise.all(collectedMembers);

    return members.filter((member) => member !== undefined) as MemberData[];
};

const convertAtomicAssetToMember = (data: any): MemberData => ({
    templateId: data.template_id,
    name: data.immutable_data.name,
    image: data.immutable_data.img,
    edenAccount: data.immutable_data.edenacc,
    bio: data.immutable_data.bio,
    inductionVideo: data.immutable_data.inductionvid || "",
    createdAt: parseInt(data.created_at_time),
    socialHandles: parseSocial(data.immutable_data.social),
});

const parseSocial = (socialHandlesJsonString: string): EdenNftSocialHandles => {
    try {
        return JSON.parse(socialHandlesJsonString);
    } catch (e) {
        console.error("fail to parse social handles ", socialHandlesJsonString);
        return {};
    }
};
