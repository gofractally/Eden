import React from "react";
import { GetServerSideProps } from "next";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import {
    queryHeadDelegate,
    queryMembers,
    queryMembersStats,
    queryMyDelegation,
    RawLayout,
    Text,
    useCurrentMember,
    useUALAccount,
} from "_app";
import { MemberData } from "members";
import { getMemberRecordFromName, getMyDelegation } from "delegates/api";

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const queryClient = new QueryClient();

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
    };
};

interface Props {
    delegatesPage: number;
}

const MEMBERS_PAGE_SIZE = 18;

export const DelegatesPage = (props: Props) => {
    const [ualAccount] = useUALAccount();
    const accountName = ualAccount?.accountName;
    const { data: currentMember } = useCurrentMember();

    const { data: members } = useQuery({
        ...queryMembers(1, MEMBERS_PAGE_SIZE),
        keepPreviousData: true,
    });

    const loggedInMemberName = currentMember?.name || accountName;

    const { data: membersStats } = useQuery({
        ...queryMembersStats,
        keepPreviousData: true,
    });

    const { data: leadRepresentative } = useQuery({
        ...queryHeadDelegate,
        keepPreviousData: true,
    });

    const { data: myDelegation } = useQuery({
        ...queryMyDelegation(members!, loggedInMemberName),
        enabled: !!members && !!loggedInMemberName,
        keepPreviousData: true,
    });

    if (
        !loggedInMemberName ||
        !members ||
        !membersStats ||
        !leadRepresentative ||
        !myDelegation
    ) {
        return <Text size="lg">Fetching Data...</Text>;
    }

    const loggedInMember: MemberData | undefined =
        members && getMemberRecordFromName(members, loggedInMemberName);
    if (!loggedInMember) {
        return <Text size="lg">Failed to get loggedInMember record</Text>;
    }

    return (
        <RawLayout title="Election">
            <Text size="sm" className="mb-8">
                Note: Data is in square brackets if it's not JSON (to show if
                something's undefined)
            </Text>
            <div>
                <Text size="lg" className="bg-gray-200">
                    My Delegation
                </Text>
                <Text size="sm" className="mt-4">
                    {`You [${loggedInMember.account}] are level (rank) ${loggedInMember.election_rank} out of ${membersStats.ranks.length}`}
                </Text>
                <Text
                    size="sm"
                    className="mt-4"
                >{`Your Delegation is as follows:`}</Text>
                <ul>
                    {myDelegation.reverse().map((delegate) => (
                        <li key={delegate.account}>
                            {delegate.name}
                            {delegate.account === leadRepresentative &&
                                `<-- Head Chief`}
                            {delegate.account === loggedInMember.account &&
                                `<-- you`}
                        </li>
                    ))}
                </ul>
            </div>
            <Text size="lg" className="bg-gray-200">
                -- Raw Table Data --
            </Text>
            <div>
                <Text size="lg" className="mb-4">
                    Member Stats
                </Text>
                <Text size="sm" className="mb-4">
                    Note: the new field `ranks[]` is{" "}
                    <span className="font-bold">
                        not relevant to the frontend
                    </span>
                    ; it's a convenience for the smart contract. It's the number
                    of people at each rank, ranks[ranks.length-1] being 1 for
                    the Head Chief, ranks[ranks.length-2] being the number of
                    Chiefs, etc.
                </Text>
                <div>
                    <pre>{JSON.stringify(membersStats || {}, null, 2)}</pre>
                </div>
            </div>
            <div>
                <Text size="lg" className="mb-4">
                    -- Raw Table Data --
                </Text>
                <Text size="lg" className="bg-gray-200">
                    Members
                </Text>
                <Text size="sm" className="mb-4">
                    <code>{`enum for status { pending = 0, active }`}</code>
                </Text>
                <Text size="sm" className="mb-4">
                    <code>
                        {`enum for election_participation_status { no_donation = 0, in_election, not_in_election, recently_inducted }`}
                    </code>
                </Text>
                <div>
                    <Text size="sm">Sampling a single member for space...</Text>
                    <pre>
                        {JSON.stringify(
                            (members && members.length && members[0]) || {},
                            null,
                            2
                        )}
                    </pre>
                </div>
            </div>
        </RawLayout>
    );
    // }
};

export default DelegatesPage;
