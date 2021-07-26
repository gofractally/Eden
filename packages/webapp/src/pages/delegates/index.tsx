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
    useMyDelegation,
} from "_app";

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
    const { data: loggedInMember } = useCurrentMember();

    const { data: members } = useQuery(queryMembers(1, MEMBERS_PAGE_SIZE));

    const { data: membersStats } = useQuery(queryMembersStats);

    const { data: leadRepresentative } = useQuery(queryHeadDelegate);

    const { data: myDelegation } = useMyDelegation();

    if (
        !loggedInMember ||
        !members ||
        !membersStats ||
        !leadRepresentative ||
        !myDelegation
    ) {
        return (
            <RawLayout>
                <Text size="lg">Fetching Data...</Text>; [
                <pre>{JSON.stringify(loggedInMember, null, 2)}</pre>] [
                <pre>{JSON.stringify(membersStats, null, 2)}</pre>] [
                <pre>{leadRepresentative}</pre>] [
                <pre>{JSON.stringify(myDelegation, null, 2)}</pre>] [
            </RawLayout>
        );
    }

    if (!loggedInMember)
        return (
            <div>
                Not logged in or Account doesn't exist in deployed
                environment...
            </div>
        );

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
                    You [{loggedInMember.account}] are level (rank){" "}
                    {loggedInMember.election_rank} out of{" "}
                    {membersStats.ranks.length}
                </Text>
                <Text size="sm" className="mt-4">
                    Your Delegation is as follows:
                </Text>
                <ul>
                    {myDelegation.reverse().map((delegate) => (
                        <li key={delegate.account}>
                            {delegate.name}
                            {delegate.account === leadRepresentative &&
                                "<-- Head Chief"}
                            {delegate.account === loggedInMember.account &&
                                "<-- you"}
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
                    Logged-in Member
                </Text>
                <pre>{JSON.stringify(loggedInMember, null, 2)}</pre>
                <Text size="lg" className="bg-gray-200">
                    Members
                </Text>
                <Text size="sm" className="mb-4">
                    See delegates/api/fixtures.ts for more info on what raw
                    member data looks like.
                </Text>
            </div>
        </RawLayout>
    );
};

export default DelegatesPage;
