import { EdenMember } from "members/interfaces";
import { CONTRACT_MEMBER_TABLE, getRow } from "_app";

export const getEdenMember = (account: string) =>
    getRow<EdenMember>(CONTRACT_MEMBER_TABLE, "account", account);
