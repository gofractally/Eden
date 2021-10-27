import { atomicAssets } from "config";
import { AssetData, AuctionableTemplateData } from "../interfaces";

const FETCH_AFTER_TIMESTAMP = atomicAssets.fetchAfter
    ? `&after=${atomicAssets.fetchAfter}`
    : "&after=1619779033000"; // genesis community launch timestamp

export const getTemplates = async (
    page = 1,
    limit = 20,
    ids: string[] = [],
    sortField = "created",
    order = "asc"
): Promise<any[]> => {
    let url = `${atomicAssets.apiBaseUrl}/templates?collection_name=${atomicAssets.collection}&schema_name=${atomicAssets.schema}&page=${page}&limit=${limit}&order=${order}&sort=${sortField}${FETCH_AFTER_TIMESTAMP}`;

    if (ids.length) {
        url += `&ids=${ids.join(",")}`;
    }

    const { data } = await executeAtomicAssetRequest(url);
    return data;
};

export const getAccountCollection = async (
    account: string,
    page = 1,
    limit = 9999,
    sortField = "transferred",
    order = "asc"
): Promise<AssetData[]> => {
    const url = `${atomicAssets.apiMarketUrl}/assets?owner=${account}&collection_name=${atomicAssets.collection}&schema_name=${atomicAssets.schema}&page=${page}&limit=${limit}&order=${order}&sort=${sortField}${FETCH_AFTER_TIMESTAMP}`;
    const { data } = await executeAtomicAssetRequest(url);
    return data;
};

export const getAuctions = async (
    seller?: string,
    templateIds?: string[],
    page = 1,
    limit = 9999
): Promise<AuctionableTemplateData[]> => {
    let url = `${atomicAssets.apiMarketUrl}/auctions?state=1&collection_name=${atomicAssets.collection}&schema_name=${atomicAssets.schema}&page=${page}&limit=${limit}&order=desc&sort=created${FETCH_AFTER_TIMESTAMP}`;

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
