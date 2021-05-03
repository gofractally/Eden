import { CONTRACT_GLOBAL_TABLE, getTableRows } from "_app";

export const getIsCommunityActive = async (): Promise<boolean> => {
    const rows = await getTableRows(CONTRACT_GLOBAL_TABLE, "community");
    if (rows?.length) {
        return rows[0].stage > 0;
    }
    return false;
};
