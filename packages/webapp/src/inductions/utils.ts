import { MemberData } from "members";
import { Induction, InductionStatus } from "./interfaces";

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
    return !induction
        ? InductionStatus.invalid
        : !induction.new_member_profile.name
        ? InductionStatus.waitingForProfile
        : !induction.video
        ? InductionStatus.waitingForVideo
        : InductionStatus.waitingForEndorsement;
};
