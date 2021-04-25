import { atomicAssets, edenContractAccount } from "config";
import { AuctionableTemplateData } from "../interfaces";

export const getTemplate = async (templateId: string) => {
    const templates = await getTemplates(1, 20, [templateId]);
    return templates.length ? templates[0] : undefined;
};

const LAUNCH_TIMESTAMP = "&after=1619230179000";

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
): Promise<any> => {
    const url = `${atomicAssets.apiBaseUrl}/assets?owner=${edenAccount}&collection_name=${atomicAssets.collection}&page=${page}&limit=${limit}&order=${order}&sort=${sortField}${LAUNCH_TIMESTAMP}`;
    const { data } = await executeAtomicAssetRequest(url);
    return data;
};

export const getOwners = async (templateId: number): Promise<string[]> => {
    const url = `${atomicAssets.apiBaseUrl}/assets?collection_name=${atomicAssets.collection}&schema_name=${atomicAssets.schema}&template_id=${templateId}&page=1&limit=9999&order=asc&sort=created`;
    const { data } = await executeAtomicAssetRequest(url);
    const owners: string[] = data.map((item: any) => item.owner);
    return owners;
};

export const getAuctions = async (): Promise<AuctionableTemplateData[]> => {
    const url = `${atomicAssets.apiMarketUrl}/auctions?state=1&collection_name=${atomicAssets.collection}&schema_name=${atomicAssets.schema}&seller=${edenContractAccount}&page=1&limit=9999&order=desc&sort=created${LAUNCH_TIMESTAMP}`;

    const { data } = await executeAtomicAssetRequest(url);

    return data
        .filter(
            (item: any) =>
                item.seller === edenContractAccount &&
                item.assets.length === 1 &&
                item.assets[0].collection.collection_name ===
                    atomicAssets.collection &&
                item.assets[0].schema.schema_name === atomicAssets.schema
        )
        .map((item: any) => {
            const asset = item.assets[0];
            const currentBid = {
                quantity: parseInt(item.price.amount),
                symbol: item.price.token_symbol,
                precision: parseInt(item.price.token_precision),
            };
            return {
                ...asset.template,
                currentBid,
                endTime: parseInt(item.end_time),
            };
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
