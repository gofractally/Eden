import {
    CONTRACT_MEMBER_TABLE,
    CONTRACT_MEMBERSTATS_TABLE,
    getRow,
} from "_app";

import { EdenMember, MemberStats } from "../interfaces";

export const getEdenMember = (account: string) =>
    getRow<EdenMember>(CONTRACT_MEMBER_TABLE, "account", account);

export const getMembersStats = async () =>
    getRow<MemberStats>(CONTRACT_MEMBERSTATS_TABLE);
