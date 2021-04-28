import { MemberData } from "members";
import { Endorsement, Induction, InductionStatus } from "./interfaces";

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

const didInviterEndorse = (
    induction: Induction,
    endorsements?: Endorsement[]
) => {
    if (!endorsements) return false;
    const inviterEndorsement = endorsements.find(
        (end) => end.inviter === induction.inviter
    );
    return !!inviterEndorsement?.endorsed;
};

// if we use this for the endorsers view too, we need to make an allowance for that
export const getInductionStatus = (
    induction?: Induction,
    endorsements?: Endorsement[]
) => {
    return !induction
        ? InductionStatus.invalid
        : !induction.new_member_profile.name
        ? InductionStatus.waitingForProfile
        : !induction.video
        ? InductionStatus.waitingForVideo
        : !!endorsements && !didInviterEndorse(induction, endorsements)
        ? InductionStatus.waitingForUserToEndorse
        : InductionStatus.waitingForOtherEndorsement;
};

export const getInductionStatusLabel = (induction?: Induction) => {
    const status = getInductionStatus(induction);
    switch (status) {
        case InductionStatus.waitingForProfile:
            return "🟡 Pending Profile";
        case InductionStatus.waitingForVideo:
            return "🟡 Pending Induction Video";
        case InductionStatus.waitingForOtherEndorsement:
            return "🟡 Waiting for Endorsements";
        default:
            return "🛑 Invalid";
    }
};
