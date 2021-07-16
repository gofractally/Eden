import {
    CONTRACT_MEMBER_TABLE,
    CONTRACT_MEMBERSTATS_TABLE,
    CONTRACT_ACCOUNT_TABLE,
    getRow,
    getTableRows,
    assetFromString,
} from "_app";

import { EdenMember, MemberStats } from "../interfaces";
import { TreasuryStats } from "../../pages/api/interfaces";
import { devUseFixtureData } from "config";
import { fixtureMemberStats } from "delegates/api/fixtures";

export const getEdenMember = (account: string) =>
    getRow<EdenMember>(CONTRACT_MEMBER_TABLE, "account", account);

export const getMemberStats = async () => {
    if (devUseFixtureData) return Promise.resolve(fixtureMemberStats);
    getRow<MemberStats>(CONTRACT_MEMBERSTATS_TABLE);
};

export const getTreasuryStats = async () => {
    const rows = await getTableRows<TreasuryStats>(CONTRACT_ACCOUNT_TABLE, {
        scope: "owned",
        lowerBound: "master",
    });

    if (!rows.length) {
        return undefined;
    }

    return assetFromString(rows[0].balance);
};
