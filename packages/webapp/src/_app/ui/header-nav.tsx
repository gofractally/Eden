import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaSignOutAlt } from "react-icons/fa";

import { useUALAccount } from "../eos";
import Button from "./button";

interface MenuItem {
    href: string;
    label: string;
    exactPath?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
    { href: "/members", label: "Members" },
    { href: "/about", label: "About" },
];

export const HeaderNav = () => {
    const [menuItems, setMenuItems] = useState(MENU_ITEMS);
    return (
        <nav className="bg-gray-800">
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                <div className="relative flex items-center justify-between h-16">
                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        {/* <HeaderMobileButton
                            open={mobileMenuOpen}
                            handleMobileMenu={handleMobileMenu}
                        /> */}
                    </div>
                    <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                        <HeaderLogo />
                        <HeaderItems menuItems={menuItems} />
                    </div>
                    <AccountMenu />
                </div>
            </div>
            {/* <HeaderMobileMenu
                open={mobileMenuOpen}
                menuItems={menuItems}
                handleNavigationClick={() => setMobileMenuOpen(false)}
            /> */}
        </nav>
    );
};

const HeaderLogo = () => (
    <div className="flex-shrink-0 flex items-center">
        <Link href="/">
            <a className="text-2xl text-yellow-500 font-bold">EdenOS</a>
        </Link>
    </div>
);

const HeaderItems = ({ menuItems }: { menuItems: MenuItem[] }) => {
    return (
        <div className="hidden sm:block sm:ml-6">
            <div className="flex space-x-4">
                {menuItems.map((item, index) => (
                    <HeaderItemLink
                        key={index}
                        href={item.href}
                        exactPath={item.exactPath}
                    >
                        {item.label}
                    </HeaderItemLink>
                ))}
            </div>
        </div>
    );
};

const HEADER_LINK_BASE_CLASS =
    "block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 hover:text-white ";

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
        (active ? "bg-gray-900 text-white" : "text-gray-300");

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
    return ualAccount ? (
        <div className="space-x-3">
            <Button href="/induction">Induction</Button>
            <Link href={`/members/${ualAccount.accountName}`}>
                <a className="text-gray-200 hover:underline">
                    {ualAccount.accountName || "(unknown)"}
                </a>
            </Link>
            <a href="#" onClick={ualLogout} className="text-gray-500">
                <FaSignOutAlt className="inline-block" />
            </a>
        </div>
    ) : (
        <Button onClick={ualShowModal}>Login</Button>
    );
};
