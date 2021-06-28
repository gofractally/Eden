import {
    CONTRACT_MEMBER_TABLE,
    CONTRACT_MEMBERSTATS_TABLE,
    CONTRACT_ACCOUNT_TABLE,
    getRow,
    assetFromString,
} from "_app";

import { EdenMember, MemberStats } from "../interfaces";
import { TreasuryStats } from "../../pages/interfaces";

export const getEdenMember = (account: string) =>
    getRow<EdenMember>(CONTRACT_MEMBER_TABLE, {
        keyName: "account",
        keyValue: account,
    });

export const getMembersStats = async () =>
    getRow<MemberStats>(CONTRACT_MEMBERSTATS_TABLE);

export const getTreasuryStats = async () => {
    const data = await getRow<TreasuryStats>(CONTRACT_ACCOUNT_TABLE, {
        scope: "owned",
        keyName: "master",
    });
    if (!data || !data.balance) {
        throw new Error("Error fetching treasury stats");
    }

    return assetFromString(data.balance);
};
