import Link from "next/link";
import { useRouter } from "next/router";
import { useQueryClient } from "react-query";
import { FaSignOutAlt } from "react-icons/fa";

import { useCurrentMember, useNavItems } from "_app";
import { ROUTES } from "_app/config";

import { useUALAccount } from "../eos";
import { Button } from "./button";
import { Image } from "./image";

export const HeaderNav = () => (
    <header className="text-gray-600 body-font border-b border-gray-200 bg-white">
        <div className="container mx-auto flex flex-wrap py-3 flex-col md:flex-row items-center">
            <HeaderLogo />
            <nav className="md:mr-auto md:ml-4 md:py-1 md:pl-4 md:border-l md:border-gray-400	flex flex-wrap items-center text-base justify-center">
                <HeaderItems />
            </nav>
            <AccountMenu />
        </div>
    </header>
);

const HeaderLogo = () => (
    <Link href="/">
        <a className="flex title-font items-center mb-4 md:mb-0">
            <Image
                src="/images/eden-logo.svg"
                alt="Eden logo"
                style={{ height: "54px" }}
            />
        </a>
    </Link>
);

const HeaderItems = () => {
    const menuItems = useNavItems();
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

const HEADER_LINK_BASE_CLASS = "mr-5 last:mr-0 hover:text-gray-900 ";

const HeaderItemLink = ({
    href,
    children,
    handleNavigationClick = null,
    exactPath = false,
}: any) => {
    const { pathname } = useRouter();
    const active = exactPath ? pathname === href : pathname.startsWith(href);
    const linkClass =
        HEADER_LINK_BASE_CLASS + (active ? "text-gray-900 font-bold" : "");
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
        <div className="mt-2 md:mt-0 space-x-3 hover:text-gray-900">
            <Link href={`${ROUTES.MEMBERS.href}/${accountName}`}>
                <a>{member?.name || accountName || "(unknown)"}</a>
            </Link>
            <a href="#" onClick={onSignOut}>
                <FaSignOutAlt className="inline-block mb-1" />
            </a>
        </div>
    ) : (
        <Button onClick={ualShowModal} className="mt-4 md:mt-0">
            Sign in
        </Button>
    );
};
