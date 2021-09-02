import React, { MouseEventHandler } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import { NAV_MENU_ITEMS } from "_app";
import { Route, ROUTES } from "_app/config";

import NavProfile from "./nav-profile";

export const MobileNav = () => (
    <>
        <TopNav />
        <BottomNav />
    </>
);

const HeaderLogo = () => (
    <div className="flex-1 flex">
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
        <header className="xs:hidden fixed z-50 top-0 left-0 right-0 h-14 flex items-center border-b px-4 bg-white">
            <HeaderLogo />
            <NavProfile location="mobile-nav" />
        </header>
    );
};

const BottomNav = () => {
    return (
        <div className="flex items-center z-50 h-16 xs:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
            <div className="w-full flex justify-around">
                {NAV_MENU_ITEMS.map((item, index) => {
                    const { Icon, label } = item;
                    return (
                        <HeaderItemLink key={`nav-route-${index}`} route={item}>
                            <div className="h-5">
                                <Icon />
                            </div>
                            <p
                                style={{ fontSize: 10 }}
                                className="font-normal label"
                            >
                                {label}
                            </p>
                            <style jsx>{`
                                @media screen and (max-width: 300px) {
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
