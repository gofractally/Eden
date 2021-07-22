import dayjs from "dayjs";

import { eosBlockTimestampISO } from "_app";
import { MemberData, memberDataDefaults } from "members";
import {
    Endorsement,
    Induction,
    InductionRole,
    InductionStatus,
    NewMemberProfile,
} from "./interfaces";

const INDUCTION_EXPIRATION_DAYS = 7;

export const convertPendingProfileToMemberData = (
    profile: NewMemberProfile,
    inviteeChainAccountName: string,
    inductionVideo?: string
): MemberData => ({
    ...memberDataDefaults,
    name: profile.name,
    image: profile.img,
    account: inviteeChainAccountName,
    bio: profile.bio,
    socialHandles: JSON.parse(profile.social || "{}"),
    inductionVideo: inductionVideo || "",
    attributions: profile.attributions || "",
});

export const getInductionStatus = (
    induction?: Induction,
    endorsements?: Endorsement[]
) => {
    if (!induction) return InductionStatus.Invalid;

    const isExpired = dayjs(eosBlockTimestampISO(induction.created_at))
        .add(INDUCTION_EXPIRATION_DAYS, "day")
        .isBefore(dayjs());

    if (isExpired) return InductionStatus.Expired;

    const isWaitingForDonation = Boolean(
        endorsements?.every((e) => e.endorsed === 1)
    );

    return !induction.new_member_profile.name
        ? InductionStatus.PendingProfile
        : !induction.video
        ? InductionStatus.PendingCeremonyVideo
        : isWaitingForDonation
        ? InductionStatus.PendingDonation
        : InductionStatus.PendingEndorsement;
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
