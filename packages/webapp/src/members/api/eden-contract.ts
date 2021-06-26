import {
    CONTRACT_MEMBER_TABLE,
    CONTRACT_MEMBERSTATS_TABLE,
    CONTRACT_ACCOUNT_TABLE,
    getRow,
    assetFromString,
} from "_app";

import { EdenMember, MemberStats } from "../interfaces";
import { TableQueryOptions } from "../../_app/eos/interfaces";

export const getEdenMember = (account: string) =>
    getRow<EdenMember>(CONTRACT_MEMBER_TABLE, {
        keyName: "account",
        keyValue: account,
    });

export const getMembersStats = async () =>
    getRow<MemberStats>(CONTRACT_MEMBERSTATS_TABLE);

export const getTreasuryStats = async () => {
    const { balance } = await getRow<any>(CONTRACT_ACCOUNT_TABLE, {
        scope: "owned",
        keyName: "master",
    });

    return assetFromString(balance);
};
