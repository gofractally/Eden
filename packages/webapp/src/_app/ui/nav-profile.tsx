import React, { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "react-query";
import { Popover } from "@headlessui/react";
import { usePopper } from "react-popper";

import { useUALAccount } from "../eos";
import { useCurrentMember, useMemberDataFromEdenMembers } from "_app/hooks";
import { Button, ProfileImage, Text } from "_app/ui";
import { ROUTES } from "_app/config";

export const NavProfile = () => {
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
    // TODO: Sign in button at various sizes
    // TODO: Handle loaders and error state, non-member state
    // TODO: Layout at smallest size in top nav bar
    return (
        <div className="flex justify-end xl:justify-start items-center mb-8">
            <PopoverWrapper>
                <div className="flex p-3 rounded-full space-x-1.5 hover:bg-gray-100 transition duration-300 ease-in-out">
                    <div className="cursor-pointer">
                        <ProfileImage imageCid={userProfile?.image} size={40} />
                    </div>
                    <div className="hidden xl:block text-left">
                        <Text size="sm" className="font-semibold">
                            {member?.name}
                        </Text>
                        <Text size="sm">@{member?.account}</Text>
                        {/* <SignOutLink onClick={onSignOut} /> */}
                    </div>
                </div>
            </PopoverWrapper>
        </div>
    );
};

export default NavProfile;

const PopoverWrapper = ({ children }: { children: React.ReactNode }) => {
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
        { placement: "top-start" }
    );

    const [ualAccount, ualLogout, ualShowModal] = useUALAccount();
    const accountName = ualAccount?.accountName;

    return (
        <Popover className="xl:w-full">
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
                <div className="shadow w-32 bg-white mb-2">
                    <Link href={`${ROUTES.MEMBERS.href}/${accountName}`}>
                        <a className="block p-3 w-full hover:bg-gray-100 text-left">
                            <Text>My profile</Text>
                        </a>
                    </Link>
                    <button
                        onClick={ualLogout}
                        title="Sign out"
                        className="block p-3 w-full hover:bg-gray-100 text-left"
                    >
                        <Text>Sign out</Text>
                    </button>
                </div>
            </Popover.Panel>
        </Popover>
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
