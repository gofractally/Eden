import React, { useEffect, useState } from "react";

import { Button, Container, Heading, LoadingCard } from "_app";
import { MemberChip, MembersGrid } from "members";

import { getCollection, getCollectedBy, memberDataDefaults } from "../api";
import { MemberData } from "../interfaces";

interface Props {
    member: MemberData;
}

export const MemberCollections = ({ member }: Props) => {
    const [tab, setTab] = useState<"collection" | "collectedBy">("collection");
    const [isLoading, setLoading] = useState(false);
    const [members, setMembers] = useState<MemberData[] | undefined>(undefined);

    useEffect(() => {
        const loadMember = async () => {
            if (tab === "collection") {
                const members = await getCollection(member.account);
                setMembers(members);
            } else {
                const { members, unknownOwners } = await getCollectedBy(
                    member.templateId
                );
                setMembers([
                    ...members,
                    ...unknownOwners.map(externalOwnersCards),
                ]);
            }
            setLoading(false);
        };
        setLoading(true);
        loadMember();
    }, [member, tab]);

    return (
        <div className="divide-y">
            <Container className="pt-8 space-y-2">
                <Heading size={1}>NFTs</Heading>
                <div className="space-x-3">
                    <Button
                        onClick={() => setTab("collection")}
                        size="sm"
                        type={tab === "collection" ? "primary" : "neutral"}
                        disabled={tab === "collection"}
                    >
                        NFT Collection
                    </Button>
                    <Button
                        onClick={() => setTab("collectedBy")}
                        size="sm"
                        type={tab === "collectedBy" ? "primary" : "neutral"}
                        disabled={tab === "collectedBy"}
                    >
                        NFT Collectors
                    </Button>
                </div>
                {tab === "collection" ? (
                    <p>
                        <span className="font-medium">{member.name}</span>{" "}
                        collects NFTs for the following Eden members:
                    </p>
                ) : (
                    <p>
                        The following Eden members or accounts collect one or
                        more of{" "}
                        <span className="font-medium">{member.name}'s</span>{" "}
                        NFTs.
                    </p>
                )}
            </Container>
            {isLoading ? (
                <LoadingCard />
            ) : (
                <MembersGrid members={members || []}>
                    {(member) => (
                        <MemberChip key={member.account} member={member} />
                    )}
                </MembersGrid>
            )}
        </div>
    );
};

const externalOwnersCards = (owner: string): MemberData => ({
    ...memberDataDefaults,
    name: owner,
});
