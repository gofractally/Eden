import React, { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "react-query";
import { Popover } from "@headlessui/react";
import { usePopper } from "react-popper";
import { IoMdLogIn } from "react-icons/io";

import { useCurrentMember, useMemberDataFromEdenMembers } from "_app/hooks";
import { Button, ProfileImage, Text } from "_app/ui";
import { ROUTES } from "_app/config";
import { MemberStatus } from "_app";

import { useUALAccount } from "../eos";

interface Props {
    location: "side-nav" | "mobile-nav";
}

export const NavProfile = ({ location }: Props) => {
    const [ualAccount, _, ualShowModal] = useUALAccount();
    const accountName = ualAccount?.accountName;

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

    const isActiveMember = member?.status === MemberStatus.ActiveMember;

    const userProfile = memberData?.[0];

    if (!ualAccount) {
        return (
            <div className="flex justify-end xs:justify-center md:justify-end xl:justify-start mb-0 xs:mb-8 my-0">
                <Button
                    onClick={ualShowModal}
                    size="sm"
                    className="md:hidden"
                    title="Sign in"
                    dataTestId="signin-nav-button"
                >
                    <span className="block xs:hidden">Sign in</span>
                    <IoMdLogIn size="24" className="hidden xs:block" />
                </Button>
                <Button
                    onClick={ualShowModal}
                    className="hidden md:block"
                    title="Sign in"
                    dataTestId="signin-nav-buttonsm"
                >
                    <span className="hidden lg:block">Sign in</span>
                    <IoMdLogIn size="24" className="block lg:hidden" />
                </Button>
            </div>
        );
    }

    let WRAPPER_CLASS = "flex justify-end xl:justify-start items-center";
    let CONTAINER_CLASS =
        "flex rounded-full space-x-1.5 hover:bg-gray-100 transition duration-300 ease-in-out";

    if (location === "side-nav") {
        WRAPPER_CLASS += " mb-8";
        CONTAINER_CLASS += " p-3";
    }

    // TODO: Get our Link component up to snuff and start depending in that
    // TODO: Handle long names
    // TODO: Don't let ProfileImage collapse when at smaller breakpoints
    // TODO: Handle loaders and error state, non-member state
    return (
        <div className={WRAPPER_CLASS}>
            <PopoverWrapper location={location} isActiveMember={isActiveMember}>
                <div className={CONTAINER_CLASS}>
                    <div className="cursor-pointer">
                        <ProfileImage imageCid={userProfile?.image} size={40} />
                    </div>
                    <div className="hidden xl:block text-left">
                        <Text size="sm" className="font-semibold">
                            {member?.name ?? "Not a member"}
                        </Text>
                        <Text size="sm">@{member?.account ?? accountName}</Text>
                    </div>
                </div>
            </PopoverWrapper>
        </div>
    );
};

export default NavProfile;

const PopoverWrapper = ({
    children,
    location,
    isActiveMember,
}: { children: React.ReactNode; isActiveMember: boolean } & Props) => {
    const [
        referenceElement,
        setReferenceElement,
    ] = useState<HTMLButtonElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
        null
    );
    const { styles, attributes } = usePopper<HTMLDivElement | null>(
        referenceElement,
        popperElement,
        { placement: location === "mobile-nav" ? "bottom-end" : "top-start" }
    );

    const queryClient = useQueryClient();
    const [ualAccount, ualLogout] = useUALAccount();
    const accountName = ualAccount?.accountName;

    const onSignOut = () => {
        queryClient.clear();
        ualLogout();
    };

    return (
        <Popover
            className={`xl:w-full ${location === "mobile-nav" ? "h-10" : ""}`}
        >
            <Popover.Button
                ref={setReferenceElement}
                className="xl:w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
            >
                {children}
            </Popover.Button>
            <Popover.Panel
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
            >
                <div
                    className="w-48 bg-white mb-2 mt-1 rounded-xl divide-y divide-gray-100"
                    style={{
                        boxShadow: "2px 2px 25px rgba(0, 0, 0, 0.15)",
                    }}
                >
                    {isActiveMember && (
                        <Link href={`${ROUTES.MEMBERS.href}/${accountName}`}>
                            <a className="block p-6 w-full hover:bg-gray-100 text-left">
                                <Text>My profile</Text>
                            </a>
                        </Link>
                    )}
                    <button
                        onClick={onSignOut}
                        title="Sign out"
                        className="block p-6 w-full hover:bg-gray-100 text-left"
                    >
                        <Text>Sign out</Text>
                    </button>
                </div>
            </Popover.Panel>
        </Popover>
    );
};
