import { MouseEventHandler } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useQueryClient } from "react-query";

import { useUALAccount } from "../eos";
import { useCurrentMember, useMemberDataFromEdenMembers } from "_app/hooks";
import { Button, ProfileImage, Text } from "_app/ui";
import { Route, ROUTES } from "_app/config";

const MENU_ITEMS = Object.keys(ROUTES)
    .map((k) => ROUTES[k])
    .filter((k) => !k.hideNav);

export const SideNav = () => (
    <header className="hidden xs:block w-24 md:w-32 lg:w-48 xl:w-56">
        <nav className="fixed flex flex-col h-screen w-24 md:w-32 lg:w-48 xl:w-56 pl-9 border-r border-lighter">
            <HeaderLogo />
            <HeaderItems menuItems={MENU_ITEMS} />
            <AccountMenu />
        </nav>
    </header>
);

const HeaderLogo = () => (
    <div className="flex mt-3 mb-5 -ml-3 md:ml-2 justify-end xl:justify-start mr-7 xl:mr-0">
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
                    style={{ height: "50px" }}
                />
            </a>
        </Link>
    </div>
);

const HeaderItems = ({ menuItems }: { menuItems: Route[] }) => {
    return (
        <div className="flex flex-col flex-1 space-y-3 mb-4 mr-6 xl:mr-0 items-end xl:items-start">
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
    "h-12 w-12 xl:h-10 xl:w-10 xl:w-44 flex items-center justify-center xl:justify-start rounded-full xl:pl-4 hover:bg-gray-50 font-semibold text-base space-x-4 ";

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
        (active ? "bg-gray-100 hover:bg-gray-100 text-blue-500" : "");
    return (
        <div>
            <Link href={href}>
                <a onClick={handleNavigationClick} title={label}>
                    <div className={navItemClass}>{children}</div>
                </a>
            </Link>
        </div>
    );
};

const AccountMenu = () => {
    const [ualAccount, ualLogout, ualShowModal] = useUALAccount();
    const accountName = ualAccount?.accountName;

    const queryClient = useQueryClient();
    const {
        data: member,
        isLoading: isLoadingCurrentMember,
        isError: isErrorCurrentMember,
    } = useCurrentMember();
    const {
        data: memberData,
        isLoading: isLoadingMemberData,
        isError: isErrorMemberData,
    } = useMemberDataFromEdenMembers(member ? [member] : []);

    const userProfile = memberData?.[0];

    const onSignOut = () => {
        queryClient.clear();
        ualLogout();
    };

    if (!ualAccount) {
        return (
            <Button onClick={ualShowModal} className="mb-8 -ml-4 mr-4">
                Sign in
            </Button>
        );
    }

    if (!member) {
        return (
            <div className="flex justify-end xl:justify-start items-center ml-2.5 mr-7 xl:mr-0 mb-8 space-x-3">
                <ProfileImage imageCid={userProfile?.image} size={40} />
                <div className="hidden xl:block">
                    <Text className="cursor-default">
                        {accountName || "(unknown)"}
                    </Text>
                    <SignOutLink onClick={onSignOut} />
                </div>
            </div>
        );
    }

    // TODO: Get our Link component up to snuff and start depending in that
    // TODO: Handle long names
    // TODO: Don't let ProfileImage collapse when at smaller breakpoints
    // TODO: How does a user sign out?
    // TODO: Sign in button at various sizes
    // TODO: Handle loaders and error state
    // TODO: Layout at smallest size in top nav bar
    return (
        <div className="flex justify-end xl:justify-start items-center ml-2.5 mr-7 xl:mr-0 mb-8 space-x-3">
            <div className="cursor-pointer">
                <Link href={`${ROUTES.MEMBERS.href}/${accountName}`}>
                    <a>
                        <ProfileImage imageCid={userProfile?.image} size={40} />
                    </a>
                </Link>
            </div>
            <div className="hidden xl:block">
                <Link href={`${ROUTES.MEMBERS.href}/${accountName}`}>
                    <a className="hover:underline">
                        <Text>{member?.name}</Text>
                    </a>
                </Link>
                <SignOutLink onClick={onSignOut} />
            </div>
        </div>
    );
};

const SignOutLink = ({ onClick }: { onClick: () => void }) => (
    <Text size="sm">
        <a
            href="#"
            onClick={onClick}
            title="Sign out"
            className="hover:underline"
        >
            Sign out
        </a>
    </Text>
);
