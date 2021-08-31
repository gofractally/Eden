import Link from "next/link";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";
import { FaSignOutAlt } from "react-icons/fa";

import { useUALAccount } from "../eos";
import { Button } from "./button";
import { Route, ROUTES } from "_app/config";
import React, { MouseEventHandler } from "react";

const MENU_ITEMS = Object.keys(ROUTES)
    .map((k) => ROUTES[k])
    .filter((k) => !k.hideNav);

export const MobileNav = () => (
    <>
        <TopNav />
        <BottomNav />
    </>
);

const HeaderLogo = () => (
    <div className="flex-1 flex justify-center">
        <Link href="/">
            <a>
                <img
                    src="/images/eden-logo.svg"
                    alt="Eden logo"
                    className="h-8 mt-2 mb-2"
                />
            </a>
        </Link>
    </div>
);

const TopNav = () => {
    return (
        <header className="xs:hidden fixed z-50 top-0 left-0 right-0 h-12 flex items-center border-b pl-28 pr-4 bg-white">
            <HeaderLogo />
            <AccountMenu />
        </header>
    );
};

const BottomNav = () => {
    return (
        <div className="flex items-center z-50 h-16 xs:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
            <div className="w-full flex justify-around">
                {MENU_ITEMS.map((item, index) => {
                    const { NavIcon, label } = item;
                    return (
                        <HeaderItemLink key={`nav-route-${index}`} route={item}>
                            {NavIcon && <NavIcon />}
                            <p
                                style={{ fontSize: 10 }}
                                className="font-normal label"
                            >
                                {label}
                            </p>
                            <style jsx>{`
                                @media screen and (max-width: 368px) {
                                    .label {
                                        display: none;
                                    }
                                }
                            `}</style>
                        </HeaderItemLink>
                    );
                })}
            </div>
        </div>
    );
};

interface HeaderItemLinkProps {
    children: React.ReactNode;
    handleNavigationClick?: MouseEventHandler<HTMLAnchorElement>;
    route: Route;
}

const NAV_ITEM_BASE_CLASS =
    "flex-1 h-12 rounded-2xl hover:bg-gray-50 font-semibold mx-1 pt-1";

const HeaderItemLink = ({
    children,
    handleNavigationClick,
    route,
}: HeaderItemLinkProps) => {
    const { exactPath, href, label } = route;
    const { pathname } = useRouter();
    const active = exactPath ? pathname === href : pathname.startsWith(href);
    const navItemClass =
        NAV_ITEM_BASE_CLASS +
        (active
            ? " bg-gray-100 hover:bg-gray-100 text-blue-500"
            : " text-gray-800");
    return (
        <div className={navItemClass}>
            <Link href={href}>
                <a
                    onClick={handleNavigationClick}
                    title={label}
                    className="flex flex-col justify-center items-center space-y-1"
                >
                    {children}
                </a>
            </Link>
        </div>
    );
};

const AccountMenu = () => {
    const [ualAccount, ualLogout, ualShowModal] = useUALAccount();
    const queryClient = useQueryClient();

    const onSignOut = () => {
        queryClient.clear();
        ualLogout();
    };

    let button = (
        <Button onClick={ualShowModal} className="">
            Sign in
        </Button>
    );

    if (ualAccount) {
        button = (
            <div className="">
                <a href="#" onClick={onSignOut} title="Sign out">
                    <FaSignOutAlt className="text-3xl inline-block text-gray-500 hover:text-gray-700" />
                </a>
            </div>
        );
    }

    return <div className="flex justify-end w-24">{button}</div>;
};
