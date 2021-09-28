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
    requiresCompletedElection?: boolean;
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
        Icon: DelegationNav,
        requiresActiveCommunity: true,
        requiresCompletedElection: true,
    },
    ELECTION: {
        href: "/election",
        label: "Election",
        Icon: ElectionNav,
        requiresActiveCommunity: true,
    },
    // >>> MOBILE NAV BAR ENDS HERE, IT ONLY SHOWS THE FIRST 5 ITEMS, THE ONES ABOVE THIS LINE <<<
    TREASURY: {
        href: "/treasury",
        label: "Treasury",
        Icon: TreasuryNav,
    },
    ELECTION_SLASH_ROUND_VIDEO_UPLOAD: {
        href: "/election/round-video-upload",
        label: "Video Upload Service",
        hideNav: true,
        Icon: ElectionNav, // TODO: pick a better Icon
        requiresActiveCommunity: true,
    },
};
