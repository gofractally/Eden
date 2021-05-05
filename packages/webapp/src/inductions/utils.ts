import dayjs from "dayjs";
import { MemberData } from "members";
import { Induction, InductionStatus } from "./interfaces";

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

export const getInductionStatus = (induction?: Induction) => {
    if (!induction) return InductionStatus.invalid;

    const isExpired = dayjs(induction.created_at)
        .add(INDUCTION_EXPIRATION_DAYS, "day")
        .isBefore(dayjs());

    return isExpired
        ? InductionStatus.expired
        : !induction.new_member_profile.name
        ? InductionStatus.waitingForProfile
        : !induction.video
        ? InductionStatus.waitingForVideo
        : InductionStatus.waitingForEndorsement;
};

export const getInductionRemainingTimeDays = (induction?: Induction) => {
    if (!induction) return "";

    const remainingTimeObj = dayjs(induction.created_at).add(
        INDUCTION_EXPIRATION_DAYS,
        "day"
    );

    const isExpired = induction && remainingTimeObj.isBefore(dayjs());

    return isExpired ? "0 days" : dayjs().to(remainingTimeObj, true);
};
