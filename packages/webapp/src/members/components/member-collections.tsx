import React, { useEffect, useState } from "react";
import { Tab } from "@headlessui/react";

import { Container, LoadingContainer, MessageContainer, Text } from "_app";
import { MemberChip, MembersGrid } from "members";

import { getCollection, getCollectedBy, memberDataDefaults } from "../api";
import { MemberData } from "../interfaces";

interface Props {
    member: MemberData;
}

// TODO: If microchain doesn't provide collection/collectors data, use react-query (not ad hoc like below)
export const MemberCollections = ({ member }: Props) => {
    return (
        <Tab.Group>
            <Tab.List className="flex">
                <StyledTab>NFT Collection</StyledTab>
                <StyledTab>NFT Collectors</StyledTab>
            </Tab.List>
            <Tab.Panels>
                <Tab.Panel>
                    <Collection member={member} />
                </Tab.Panel>
                <Tab.Panel>
                    <Collectors member={member} />
                </Tab.Panel>
            </Tab.Panels>
        </Tab.Group>
    );
};

export default MemberCollections;

const tabClassName = ({ selected }: { selected: boolean }) => {
    const baseClass =
        "flex-1 lg:flex-none h-14 lg:px-12 border-b-2 focus:outline-none hover:bg-gray-100";
    if (!selected)
        return `${baseClass} text-gray-500 border-white hover:border-gray-100`;
    return `${baseClass} border-blue-500 text-gray-700`;
};

const StyledTab = ({ children }: { children: React.ReactNode }) => (
    <Tab className={tabClassName}>
        <p className="text-sm font-semibold">{children}</p>
    </Tab>
);

const Collection = ({ member }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [members, setMembers] = useState<MemberData[] | undefined>([]);

    useEffect(() => {
        const loadMembers = async () => {
            console.log(member.account);
            const members = await getCollection(member.account);
            setMembers(members);
            setIsLoading(false);
        };
        setIsLoading(true);
        loadMembers();
    }, []);

    if (isLoading) return <LoadingContainer />;

    if (!members?.length) {
        return (
            <MessageContainer
                title="No NFTs found"
                message="This user is not collecting any Eden member NFTs."
            />
        );
    }

    return (
        <>
            <Container>
                <Text>
                    <span className="font-medium">{member.name}</span> collects
                    NFTs for the following Eden members:
                </Text>
            </Container>
            <MembersGrid members={members}>
                {(member) => (
                    <MemberChip
                        key={`member-collection-${member.account}`}
                        member={member}
                    />
                )}
            </MembersGrid>
        </>
    );
};

const Collectors = ({ member }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [members, setMembers] = useState<MemberData[]>([]);

    useEffect(() => {
        const loadMembers = async () => {
            const { members, unknownOwners } = await getCollectedBy(
                member.templateId
            );
            setMembers([...members, ...unknownOwners.map(externalOwnersCards)]);
            setIsLoading(false);
        };
        setIsLoading(true);
        loadMembers();
    }, []);

    if (isLoading) return <LoadingContainer />;

    if (!members?.length) {
        return (
            <MessageContainer
                title="No collectors found"
                message="No one is collecting this member's NFTs."
            />
        );
    }

    return (
        <>
            <Container>
                <Text>
                    The following Eden members or accounts collect one or more
                    of <span className="font-medium">{member.name}'s</span>{" "}
                    NFTs.
                </Text>
            </Container>
            <MembersGrid members={members}>
                {(member) => (
                    <MemberChip
                        key={`member-collector-${member.account}`}
                        member={member}
                    />
                )}
            </MembersGrid>
        </>
    );
};

const externalOwnersCards = (owner: string): MemberData => ({
    ...memberDataDefaults,
    name: owner,
});
