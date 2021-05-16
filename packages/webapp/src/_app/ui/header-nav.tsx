import Link from "next/link";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";
import { FaSun, FaSignOutAlt } from "react-icons/fa";

import { useUALAccount } from "../eos";
import { useCurrentMember } from "_app/hooks";
import { ActionButton } from "./action-button";
import useDarkMode from "_app/hooks/useDarkMode";
import React from "react";

interface MenuItem {
    href: string;
    label: string;
    exactPath?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
    { href: "/", label: "Home", exactPath: true },
    { href: "/members", label: "Community" },
    { href: "/induction", label: "Membership" },
];

const DarkModeSetting = () => {
    const [isDark, toggleDark] = useDarkMode();
    const FormattedIcon = React.createElement(FaSun, {
        className: ` inline-flex ${isDark ? "text-gray-300" : "text-gray-800"}`,
    });

    return (
        <div className="p-3" onClick={() => toggleDark()}>
            {FormattedIcon}
        </div>
    );
};

export const HeaderNav = () => (
    <header className="text-gray-600 body-font border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
        <div className="container mx-auto flex flex-wrap py-3 flex-col md:flex-row items-center">
            <HeaderLogo />
            <nav className="md:mr-auto md:ml-4 md:py-1 md:pl-4 md:border-l md:border-gray-400	flex flex-wrap items-center text-base justify-center">
                <HeaderItems menuItems={MENU_ITEMS} />
            </nav>
            <DarkModeSetting />
            <AccountMenu />
        </div>
    </header>
);

const HeaderLogo = () => (
    <Link href="/">
        <a className="flex title-font items-center mb-4 md:mb-0 dark:bg-gray-400 dark:border rounded dark:rounded-2xl">
            <img
                src="/images/eden-logo.svg"
                alt="Eden logo"
                style={{ height: "54px" }}
            />
        </a>
    </Link>
);

const HeaderItems = ({ menuItems }: { menuItems: MenuItem[] }) => {
    return (
        <>
            {menuItems.map((item, index) => (
                <HeaderItemLink
                    key={index}
                    href={item.href}
                    exactPath={item.exactPath}
                >
                    {item.label}
                </HeaderItemLink>
            ))}
        </>
    );
};

const HEADER_LINK_BASE_CLASS =
    "mr-5 last:mr-0 hover:text-gray-900 dark:text-gray-400";

const HeaderItemLink = ({
    href,
    children,
    handleNavigationClick = null,
    exactPath = false,
}: any) => {
    const { pathname } = useRouter();
    const active = exactPath ? pathname === href : pathname.startsWith(href);
    const linkClass =
        HEADER_LINK_BASE_CLASS +
        (active ? "text-gray-900 font-bold dark:text-gray-200" : "");
    return (
        <Link href={href}>
            <a className={linkClass} onClick={handleNavigationClick}>
                {children}
            </a>
        </Link>
    );
};

const AccountMenu = () => {
    const [ualAccount, ualLogout, ualShowModal] = useUALAccount();
    const accountName = ualAccount?.accountName;

    const queryClient = useQueryClient();
    const { data: member } = useCurrentMember();

    const onSignOut = () => {
        queryClient.clear();
        ualLogout();
    };

    return ualAccount ? (
        <div className="mt-2 md:mt-0 space-x-3 hover:text-gray-900 dark:text-gray-300">
            <Link href={`/members/${accountName}`}>
                <a>{member?.name || accountName || "(unknown)"}</a>
            </Link>
            <a href="#" onClick={onSignOut}>
                <FaSignOutAlt className="inline-block mb-1" />
            </a>
        </div>
    ) : (
        <ActionButton onClick={ualShowModal} className="mt-4 md:mt-0">
            Sign in
        </ActionButton>
    );
};
