import hash from "hash.js";
import * as eosjsSerialize from "eosjs/dist/eosjs-serialize";
import * as eosjsNumeric from "eosjs/dist/eosjs-numeric";

import { Induction, MemberData } from "./interfaces";

export const accountTo32BitHash = (account: string): number[] =>
    hash.sha256().update(account).digest().slice(0, 4);

export const primaryKeyFromAccountInstant = (account: string): string => {
    const serialBuffer = new eosjsSerialize.SerialBuffer();
    serialBuffer.pushArray(accountTo32BitHash(account));
    serialBuffer.pushUint32(Date.now());

    const bytes = serialBuffer.getUint8Array(8);
    return eosjsNumeric.binaryToDecimal(bytes);
};

export const convertPendingProfileToMemberData = (
    induction: Induction
): MemberData => {
    return {
        templateId: 0,
        name: induction.new_member_profile.name,
        image: induction.new_member_profile.img,
        edenAccount: induction.invitee,
        bio: induction.new_member_profile.bio,
        socialHandles: JSON.parse(induction.new_member_profile.social || "{}"),
        inductionVideo: induction.video || "",
        createdAt: 0,
    };
};
