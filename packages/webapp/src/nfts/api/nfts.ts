import { atomicAssets } from "config";

export const getTemplates = async (
    page = 1,
    limit = 20,
    ids: string[] = [],
    sortField = "created",
    order = "asc"
): Promise<any[]> => {
    let url = `${atomicAssets.apiBaseUrl}/templates?collection_name=${atomicAssets.collection}&schema_name=${atomicAssets.schema}&page=${page}&limit=${limit}&order=${order}&sort=${sortField}`;

    url += "&lower_bound=66281"; // TODO: remove when resetting collection

    if (ids.length) {
        url += `&ids=${ids.join(",")}`;
    }

    const { data } = await executeAtomicAssetRequest(url);
    console.info("templates data", data);
    return data;
};

export const getAccountCollection = async (
    edenAccount: string
): Promise<any> => {
    const url = `${atomicAssets.apiBaseUrl}/accounts/${edenAccount}/${atomicAssets.collection}`;
    const { data } = await executeAtomicAssetRequest(url);
    return data;
};

export const getOwners = async (templateId: number): Promise<string[]> => {
    const url = `${atomicAssets.apiBaseUrl}/assets?collection_name=${atomicAssets.collection}&schema_name=${atomicAssets.schema}&template_id=${templateId}&page=1&limit=9999&order=asc&sort=created`;
    const { data } = await executeAtomicAssetRequest(url);
    const owners: string[] = data.map((item: any) => item.owner);
    return owners;
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
