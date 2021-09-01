import { IoHomeOutline } from "react-icons/io5";
import { FiCheckSquare, FiUsers } from "react-icons/fi";
import { AiOutlineIdcard } from "react-icons/ai";
import { BsStar } from "react-icons/bs";

export interface Route {
    href: string;
    label: string;
    exactPath?: boolean;
    hideNav?: boolean;
    NavIcon?: React.ReactNode;
}

export const ROUTES: { [key: string]: Route } = {
    HOME: {
        href: "/",
        label: "Home",
        NavIcon: () => <IoHomeOutline className="text-2xl xl:text-xl" />,
        exactPath: true,
    },
    MEMBERS: {
        href: "/members",
        label: "Community",
        NavIcon: () => <FiUsers className="text-2xl xl:text-xl" />,
    },
    INDUCTION: {
        href: "/induction",
        label: "Membership",
        NavIcon: () => (
            <AiOutlineIdcard
                className="text-3xl xl:text-2xl -ml-px -mr-px -mt-1"
                style={{ marginBottom: -2, marginTop: -2 }}
            />
        ),
    },
    DELEGATION: {
        href: "/delegates",
        label: "My Delegates",
        hideNav: true,
        NavIcon: () => (
            <BsStar
                className="text-3xl xl:text-2xl -ml-px"
                style={{ marginBottom: -2, marginTop: -2 }}
            />
        ),
    },
    TREASURY: {
        href: "/treasury",
        label: "Treasury",
        NavIcon: () => (
            <img
                src="/images/eos-logo.svg"
                alt="EOS logo"
                className="h-7 mx-0.5"
            />
        ),
    },
    ELECTION: {
        href: "/election",
        label: "Election",
        NavIcon: () => (
            <FiCheckSquare
                className="text-3xl xl:text-2xl -ml-px -mt-px -mb-px"
                style={{ fontSize: 28 }}
            />
        ),
    },
};
