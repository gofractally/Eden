import React, { useEffect, useState } from "react";

import { Button, Card } from "_app";

import { getCollection, getCollectedBy } from "../api";
import { MemberData } from "../interfaces";
import { MembersGrid } from "./members-grid";

interface Props {
    account: string;
    templateId: number;
}

export const MemberCollections = ({ account, templateId }: Props) => {
    const [tab, setTab] = useState<"collection" | "collectedBy">("collection");
    const [isLoading, setLoading] = useState(false);
    const [members, setMembers] = useState<MemberData[] | undefined>(undefined);

    useEffect(() => {
        const loadMember = async () => {
            if (tab === "collection") {
                const members = await getCollection(account);
                setMembers(members);
            } else {
                const { members, unknownOwners } = await getCollectedBy(
                    templateId
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
    }, [account, templateId, tab]);

    return (
        <Card>
            <Button
                color="gray"
                outline={tab !== "collection"}
                disabled={tab === "collection"}
                onClick={() => setTab("collection")}
            >
                Collection
            </Button>
            <Button
                color="gray"
                outline={tab !== "collectedBy"}
                disabled={tab === "collectedBy"}
                onClick={() => setTab("collectedBy")}
                className="ml-4"
            >
                Collected By
            </Button>
            <hr className="m-2" />
            {isLoading ? "loading..." : <MembersGrid members={members || []} />}
        </Card>
    );
};

const externalOwnersCards = (owner: string): MemberData => {
    return {
        templateId: 0,
        name: owner,
        image: "",
        account: "",
        bio: "",
        socialHandles: {},
        inductionVideo: "",
        attributions: "",
        createdAt: 0,
    };
};
