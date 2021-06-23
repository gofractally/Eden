import {
    CONTRACT_MEMBER_TABLE,
    CONTRACT_MEMBERSTATS_TABLE,
    CONTRACT_ACCOUNT_TABLE,
    getRow,
    assetFromString,
} from "_app";

import { EdenMember, MemberStats } from "../interfaces";

export const getEdenMember = (account: string) =>
    getRow<EdenMember>(CONTRACT_MEMBER_TABLE, "account", account);

export const getMembersStats = async () =>
    getRow<MemberStats>(CONTRACT_MEMBERSTATS_TABLE);

export const getTreasuryStats = async () => {
    const { balance } = await getRow<any>(CONTRACT_ACCOUNT_TABLE, "master", undefined, {scope: "owned"});
    return assetFromString(balance)
}
