import { CONTRACT_MEMBER_TABLE, getRow } from "_app";

export const getEdenMember = (account: string) =>
    getRow(CONTRACT_MEMBER_TABLE, "account", account);
