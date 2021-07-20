import React from "react";
import { GetServerSideProps } from "next";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import {
    queryHeadDelegate,
    queryMembers,
    queryMembersStats,
    RawLayout,
    Text,
    useCurrentMember,
    useUALAccount,
} from "_app";
import { MemberData } from "members";

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

    const { data: membersStats } = useQuery({
        ...queryMembersStats,
        keepPreviousData: true,
    });

    const { data: lead_representative } = useQuery({
        ...queryHeadDelegate,
        keepPreviousData: true,
    });

    const loggedInMemberName = currentMember?.name || accountName;
    const loggedInMember: MemberData | undefined = members?.filter(
        (member) => member.account === loggedInMemberName
    )[0];

    const getMyDelegation = (members: MemberData[]): MemberData[] => {
        let myDelegates: MemberData[] = [];
        if (loggedInMember === undefined) return myDelegates;
        // establish height of tree from electionState
        // const heightOfDelegationTree = membersStats?.ranks.length;
        // get logged-in user's rank
        // loggedInMember.election_rank
        // loggedInMember.representative
        // get lead rep's account name
        let m: MemberData = getMemberRecordFromName(
            members,
            loggedInMember?.account
        );
        while (m && m?.account != lead_representative) {
            myDelegates.push(m);
            m = getMemberRecordFromName(members, m?.representative!);
        }
        members &&
            myDelegates.length &&
            myDelegates.push(
                getMemberRecordFromName(members, lead_representative!)
            );
        return myDelegates;
    };

    const getMemberRecordFromName = (
        members: MemberData[],
        memberAccount: string
    ) => members?.filter((member) => member.account === memberAccount)[0];

    const delegates: MemberData[] =
        members && membersStats && loggedInMember
            ? getMyDelegation(members)
            : [];

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
                    {`You [${loggedInMember?.account}] are level (rank) ${loggedInMember?.election_rank} out of ${membersStats?.ranks.length}`}
                </Text>
                <Text
                    size="sm"
                    className="mt-4"
                >{`Your Delegates are as follows (You at the bottom; Head Chief at the top):`}</Text>
                <ul>
                    {/* {delegates.map((delegate) => (
                            <li key={delegate.account}> {delegate}</li>
                        ))} */}
                    {delegates.reverse().map((delegate) => (
                        <li key={delegate.account}> {delegate.name}</li>
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
