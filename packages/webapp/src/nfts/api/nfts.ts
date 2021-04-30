import { atomicAssets, edenContractAccount } from "config";
import { AssetData, AuctionableTemplateData } from "../interfaces";

export const getTemplate = async (templateId: string) => {
    const templates = await getTemplates(1, 20, [templateId]);
    return templates.length ? templates[0] : undefined;
};

const LAUNCH_TIMESTAMP = "&after=1619690573000";

export const getTemplates = async (
    page = 1,
    limit = 20,
    ids: string[] = [],
    sortField = "created",
    order = "asc"
): Promise<any[]> => {
    let url = `${atomicAssets.apiBaseUrl}/templates?collection_name=${atomicAssets.collection}&schema_name=${atomicAssets.schema}&page=${page}&limit=${limit}&order=${order}&sort=${sortField}${LAUNCH_TIMESTAMP}`;

    if (ids.length) {
        url += `&ids=${ids.join(",")}`;
    }

    const { data } = await executeAtomicAssetRequest(url);
    return data;
};

export const getAccountCollection = async (
    edenAccount: string,
    page = 1,
    limit = 9999,
    sortField = "transferred",
    order = "asc"
): Promise<AssetData[]> => {
    const url = `${atomicAssets.apiMarketUrl}/assets?owner=${edenAccount}&collection_name=${atomicAssets.collection}&schema_name=${atomicAssets.schema}&page=${page}&limit=${limit}&order=${order}&sort=${sortField}${LAUNCH_TIMESTAMP}`;
    const { data } = await executeAtomicAssetRequest(url);
    return data;
};

export const getSalesForTemplates = async (
    ids: string[],
    page = 1,
    limit = 9999,
    sortField = "created",
    order = "asc"
): Promise<any> => {
    const url = `${atomicAssets.apiMarketUrl}/sales?template_id=${ids.join(
        ","
    )}&collection_name=${
        atomicAssets.collection
    }&page=${page}&limit=${limit}&order=${order}&sort=${sortField}${LAUNCH_TIMESTAMP}`;
    const { data } = await executeAtomicAssetRequest(url);
    return data;
};

export const getOwners = async (templateId: number): Promise<string[]> => {
    const url = `${atomicAssets.apiBaseUrl}/assets?collection_name=${atomicAssets.collection}&schema_name=${atomicAssets.schema}&template_id=${templateId}&page=1&limit=9999&order=asc&sort=created`;
    const { data } = await executeAtomicAssetRequest(url);
    const owners: string[] = data.map((item: any) => item.owner);
    return owners;
};

export const getAuctions = async (
    seller?: string,
    templateIds?: string[]
): Promise<AuctionableTemplateData[]> => {
    let url = `${atomicAssets.apiMarketUrl}/auctions?state=1&collection_name=${atomicAssets.collection}&schema_name=${atomicAssets.schema}&page=1&limit=9999&order=desc&sort=created${LAUNCH_TIMESTAMP}`;

    if (seller) {
        url += `&seller=${seller}`;
    }

    if (templateIds && templateIds.length) {
        url += `&template_id=${templateIds.join(",")}`;
    }

    const { data } = await executeAtomicAssetRequest(url);

    return data
        .filter((item: any) => item.assets.length === 1)
        .map((item: any) => {
            const seller = item.seller;
            const asset = item.assets[0];
            const auctionId = item.auction_id;
            const assetId = asset.asset_id;
            const templateMint = parseInt(asset.template_mint);
            const endTime = parseInt(item.end_time);
            const currentBid = {
                quantity: parseInt(item.price.amount),
                symbol: item.price.token_symbol,
                precision: parseInt(item.price.token_precision),
            };
            return {
                seller,
                ...asset.template,
                auctionId,
                currentBid,
                assetId,
                templateMint,
                endTime,
            } as AuctionableTemplateData;
        });
};

const executeAtomicAssetRequest = async (url: string): Promise<any> => {
    const response = await fetch(url);
    if (!response.ok) {
        console.error(response);
        throw new Error("response not ok");
    }

    const json = await response.json();
    if (!json.success || !json.data) {
        console.error("unsuccessfull response", json);
    }

    return json;
};
