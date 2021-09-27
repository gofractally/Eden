import React from "react";
import {
    CommunityNav,
    DelegationNav,
    ElectionNav,
    HomeNav,
    MembershipNav,
    TreasuryNav,
} from "_app/ui/nav-icons";

export interface Route {
    href: string;
    label: string;
    Icon: React.ComponentType;
    exactPath?: boolean;
    hideNav?: boolean;
    requiresActiveCommunity?: boolean;
}

export const ROUTES: { [key: string]: Route } = {
    HOME: {
        href: "/",
        label: "Home",
        exactPath: true,
        Icon: HomeNav,
    },
    MEMBERS: {
        href: "/members",
        label: "Community",
        Icon: CommunityNav,
    },
    INDUCTION: {
        href: "/induction",
        label: "Membership",
        Icon: MembershipNav,
    },
    DELEGATION: {
        href: "/delegates",
        label: "My Delegates",
        hideNav: true,
        Icon: DelegationNav,
        requiresActiveCommunity: true,
    },
    TREASURY: {
        href: "/treasury",
        label: "Treasury",
        Icon: TreasuryNav,
    },
    ELECTION: {
        href: "/election",
        label: "Election",
        Icon: ElectionNav,
        requiresActiveCommunity: true,
    },
    ELECTION_SLASH_ROUND_VIDEO_UPLOAD: {
        href: "/election/round-video-upload",
        label: "Video Upload Service",
        hideNav: true,
        Icon: ElectionNav, // TODO: pick a better Icon
        requiresActiveCommunity: true,
    },
};
