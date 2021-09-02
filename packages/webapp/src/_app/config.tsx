import { IoHomeOutline } from "react-icons/io5";
import { FiCheckSquare, FiUsers } from "react-icons/fi";
import { AiOutlineIdcard } from "react-icons/ai";
import { BsStar } from "react-icons/bs";

export interface Route {
    href: string;
    label: string;
    exactPath?: boolean;
    hideNav?: boolean;
    NavIcon?: React.ComponentType;
}

export const ROUTES: { [key: string]: Route } = {
    HOME: {
        href: "/",
        label: "Home",
        NavIcon: () => (
            <img src="/images/nav/home-nav.svg" alt="Home" className="h-5" />
        ),
        exactPath: true,
    },
    MEMBERS: {
        href: "/members",
        label: "Community",
        NavIcon: () => (
            <img
                src="/images/nav/community-nav.svg"
                alt="Community"
                className="h-5"
            />
        ),
    },
    INDUCTION: {
        href: "/induction",
        label: "Membership",
        NavIcon: () => (
            <img
                src="/images/nav/membership-nav.svg"
                alt="Membership"
                className="h-5"
            />
        ),
    },
    DELEGATION: {
        href: "/delegates",
        label: "My Delegates",
        hideNav: true,
        NavIcon: () => (
            <img
                src="/images/nav/delegation-nav.svg"
                alt="My Delegates"
                className="h-5"
            />
        ),
    },
    TREASURY: {
        href: "/treasury",
        label: "Treasury",
        NavIcon: () => (
            <img
                src="/images/nav/treasury-nav.svg"
                alt="Treasury"
                className="h-5"
            />
        ),
    },
    ELECTION: {
        href: "/election",
        label: "Election",
        NavIcon: () => (
            <img
                src="/images/nav/election-nav.svg"
                alt="Election"
                className="h-5"
            />
        ),
    },
};
