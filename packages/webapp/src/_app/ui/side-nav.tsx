import { MouseEventHandler } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import { Route, ROUTES } from "_app/config";

import NavProfile from "./nav-profile";

const MENU_ITEMS = Object.keys(ROUTES)
    .map((k) => ROUTES[k])
    .filter((k) => !k.hideNav);

export const SideNav = () => (
    <header className="hidden xs:block w-24 md:w-32 lg:w-48 xl:w-64">
        <nav className="fixed flex flex-col h-screen w-24 md:w-32 lg:w-48 xl:w-64 pl-5 pr-6 xl:pr-4 border-r border-lighter">
            <HeaderLogo />
            <HeaderItems menuItems={MENU_ITEMS} />
            <div className="-mr-2.5 xl:mr-0">
                <NavProfile />
            </div>
        </nav>
    </header>
);

const HeaderLogo = () => (
    <div className="flex mt-3 mb-5 -ml-3 md:ml-0 justify-end xl:justify-start mr-1.5">
        <Link href="/">
            <a>
                <img
                    src="/images/eden-logo.svg"
                    alt="Eden logo"
                    className="hidden xl:block"
                    style={{ height: "50px" }}
                />
                <img
                    src="/images/eden-logo-penta.svg"
                    alt="Eden logo"
                    className="block xl:hidden"
                    style={{ height: "46px" }}
                />
            </a>
        </Link>
    </div>
);

const HeaderItems = ({ menuItems }: { menuItems: Route[] }) => {
    return (
        <div className="flex flex-col flex-1 space-y-3 mb-4 items-end xl:items-start">
            {menuItems.map((item, index) => {
                const { label, NavIcon } = item;
                return (
                    <HeaderItemLink key={`nav-route-${index}`} route={item}>
                        {NavIcon && <NavIcon />}
                        <p className="hidden xl:block">{label}</p>
                    </HeaderItemLink>
                );
            })}
        </div>
    );
};

interface HeaderItemLinkProps {
    children: React.ReactNode;
    handleNavigationClick?: MouseEventHandler<HTMLAnchorElement>;
    route: Route;
}

const NAV_ITEM_BASE_CLASS =
    "h-12 w-12 xl:w-full flex items-center justify-center xl:justify-start rounded-full xl:pl-4 transition duration-300 ease-in-out hover:bg-gray-100 font-semibold text-base space-x-4 ";

const HeaderItemLink = ({
    children,
    handleNavigationClick,
    route,
}: HeaderItemLinkProps) => {
    const { exactPath, href, label } = route;
    const { pathname } = useRouter();
    const active = exactPath ? pathname === href : pathname.startsWith(href);
    const navItemClass =
        NAV_ITEM_BASE_CLASS + (active ? "bg-gray-100 text-blue-500" : "");
    return (
        <div className="xl:w-full">
            <Link href={href}>
                <a onClick={handleNavigationClick} title={label}>
                    <div className={navItemClass}>{children}</div>
                </a>
            </Link>
        </div>
    );
};
