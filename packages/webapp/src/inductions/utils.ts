import dayjs from "dayjs";

import { eosBlockTimestampISO } from "_app";
import { MemberData } from "members";
import {
    Endorsement,
    Induction,
    InductionRole,
    InductionStatus,
} from "./interfaces";

const INDUCTION_EXPIRATION_DAYS = 7;

export const convertPendingProfileToMemberData = (
    induction: Induction
): MemberData => {
    return {
        templateId: 0,
        name: induction.new_member_profile.name,
        image: induction.new_member_profile.img,
        account: induction.invitee,
        bio: induction.new_member_profile.bio,
        socialHandles: JSON.parse(induction.new_member_profile.social || "{}"),
        inductionVideo: induction.video || "",
        attributions: induction.new_member_profile.attributions || "",
        createdAt: 0,
    };
};

export const getInductionStatus = (
    induction?: Induction,
    endorsements?: Endorsement[]
) => {
    if (!induction) return InductionStatus.invalid;

    const isExpired = dayjs(eosBlockTimestampISO(induction.created_at))
        .add(INDUCTION_EXPIRATION_DAYS, "day")
        .isBefore(dayjs());

    if (isExpired) return InductionStatus.expired;

    const isWaitingForDonation =
        endorsements?.every((e) => e.endorsed === 1) ?? false;

    if (isWaitingForDonation) return InductionStatus.waitingForDonation;

    return !induction.new_member_profile.name
        ? InductionStatus.waitingForProfile
        : !induction.video
        ? InductionStatus.waitingForVideo
        : InductionStatus.waitingForEndorsement;
};

export const getInductionRemainingTimeDays = (induction?: Induction) => {
    if (!induction) return "";

    const remainingTimeObj = dayjs(
        eosBlockTimestampISO(induction.created_at)
    ).add(INDUCTION_EXPIRATION_DAYS, "day");

    const isExpired = induction && remainingTimeObj.isBefore(dayjs());

    return isExpired ? "0 days" : dayjs().to(remainingTimeObj, true);
};

export const getInductionUserRole = (
    endorsements: Endorsement[],
    ualAccount?: any,
    induction?: Induction
): InductionRole => {
    if (!ualAccount) return InductionRole.Unauthenticated;
    if (!induction) return InductionRole.Unknown;
    const accountName = ualAccount.accountName;
    if (accountName === induction.invitee) return InductionRole.Invitee;
    if (accountName === induction.inviter) return InductionRole.Inviter;
    if (endorsements.find((e) => e.endorser === accountName)) {
        return InductionRole.Endorser;
    }
    return InductionRole.Unknown;
};
