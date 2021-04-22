import { Endorsement, Induction } from "../interfaces";

export const INDUCTION_NEW_MOCK: Induction = {
    id: "16493099469611189919",
    inviter: "edtcaptomega",
    invitee: "edenmember11",
    endorsements: 3,
    created_at: "2021-04-21T14:18:00.500",
    video: "",
    new_member_profile: {
        name: "",
        img: "",
        bio: "",
        social: "",
    },
};

export const ENDORSEMENTS_NEW_MOCK: Endorsement[] = [
    {
        id: "0",
        inviter: "edenmembers1",
        invitee: "edenmember11",
        endorser: "edenmember12",
        endorsed: 0,
        induction_id: "16493099469611189919",
    },
    {
        id: "1",
        inviter: "edenmembers1",
        invitee: "edenmember11",
        endorser: "crank",
        endorsed: 0,
        induction_id: "16493099469611189919",
    },
    {
        id: "2",
        inviter: "edenmembers1",
        invitee: "edenmember11",
        endorser: "coolant",
        endorsed: 0,
        induction_id: "16493099469611189919",
    },
];

export const INDUCTION_PENDING_VIDEO_MOCK: Induction = {
    id: "16493099469611189919",
    inviter: "edtcaptomega",
    invitee: "edenmember11",
    endorsements: 3,
    created_at: "2021-04-21T14:18:00.500",
    video: "",
    new_member_profile: {
        name: "Spark Plug",
        img: "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws",
        bio: "Hey, Sparky here! I'm just sparking freedom! :)",
        social: `{"eosCommunity":"sparkplug0025", "telegram":"sparkplug0025"}`,
    },
};

export const INDUCTION_PENDING_ENDORSEMENTS_MOCK: Induction = {
    id: "16493099469611189919",
    inviter: "edtcaptomega",
    invitee: "edenmember11",
    endorsements: 3,
    created_at: "2021-04-21T14:18:00.500",
    video: "QmTYqoPYf7DiVebTnvwwFdTgsYXg2RnuPrt8uddjfW2kHS",
    new_member_profile: {
        name: "Spark Plug",
        img: "Qmb7WmZiSDXss5HfuKfoSf6jxTDrHzr8AoAUDeDMLNDuws",
        bio: "Hey, Sparky here! I'm just sparking freedom! :)",
        social: `{"eosCommunity":"sparkplug0025", "telegram":"sparkplug0025"}`,
    },
};

export const ENDORSEMENTS_PENDING_LAST_MOCK: Endorsement[] = ENDORSEMENTS_NEW_MOCK.map(
    (endorsement) => ({ ...endorsement })
);
ENDORSEMENTS_PENDING_LAST_MOCK[0].endorsed = 1;
