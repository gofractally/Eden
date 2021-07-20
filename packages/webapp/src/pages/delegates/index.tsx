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
import { MemberData, MemberStats, MemberStatus } from "members";

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
    const [ualAccount, ualLogout, ualShowModal] = useUALAccount();
    const accountName = ualAccount?.accountName;
    console.info("ualAccount:");
    console.info(ualAccount);
    // const loggedInMember = {
    //     account: "edenmember12",
    // };
    // const isLoadingLoggedInMember = false;
    // const isLoggedInMemberError = false;
    const {
        data: currentMember,
        isLoading: isLoadingLoggedInMember,
        isError: isLoggedInMemberError,
    } = useCurrentMember();

    const { isError: isMembersDataFetchError, data: members } = useQuery({
        ...queryMembers(1, MEMBERS_PAGE_SIZE),
        keepPreviousData: true,
    });

    const {
        isError: isMemberStatsDataFetchError,
        data: membersStats,
    } = useQuery({
        ...queryMembersStats,
        keepPreviousData: true,
    });

    const {
        isError: isLeadRepresentativeDataFetchError,
        data: lead_representative,
    } = useQuery({
        ...queryHeadDelegate,
        keepPreviousData: true,
    });

    const rank = 3;
    console.info(
        `determining loggedInMember currentMember[${currentMember}], accountName[${accountName}]`
    );
    const loggedInMember = currentMember?.name || accountName;

    const getMyDelegation = (
        members: MemberData[],
        membersStats: MemberStats
    ): string[] => {
        let myDelegates: string[] = [];
        console.info("getMyDelegates.loggedInMember:");
        console.info(loggedInMember);
        if (loggedInMember === undefined) return myDelegates;
        // establish height of tree from electionState
        const heightOfDelegationTree = membersStats?.ranks.length;
        // get logged-in user's rank
        // loggedInMember.election_rank
        // loggedInMember.representative
        // get lead rep's account name
        let m: MemberData = members.filter(
            (member) => member.account === loggedInMember?.account
        )[0];
        // console.info("m:");
        // console.info(m);
        while (m && m?.account != lead_representative) {
            // console.info(
            //     `while m.account[${m?.account}, m.rep[${m.representative}], lead_representative[${lead_representative}]`
            // );
            myDelegates.push(m?.account);
            m = members.filter(
                (member) => member.account === m?.representative
            )[0];
        }
        myDelegates.length && myDelegates.push(lead_representative!);
        // console.info("myDelegates:");
        // console.info(myDelegates);
        // iterate through members and build the tree
        // console.info("members:");
        // members.forEach((member) => {
        //     console.info(member);
        // });
        return myDelegates;
    };

    const delegates: string[] =
        members && membersStats && loggedInMember
            ? getMyDelegation(members, membersStats)
            : [];

    console.info(
        `isLoadingLoggedInMember[${isLoadingLoggedInMember}], isLoggedInMemberError[${isLoggedInMemberError}]`
    );
    if (isLoadingLoggedInMember) {
        return <div>Loading...</div>;
    } else if (isLoggedInMemberError) {
        return <div>Error...</div>;
    } else if (!loggedInMember) {
        return <div>No one logged in: loggedInMember: {loggedInMember}</div>;
    } else {
        console.info(`rendering page.loggedInMember:${loggedInMember}`);
        return (
            <RawLayout title="Election">
                <Text size="sm" className="mb-8">
                    Note: Data is in square brackets if it's not JSON (to show
                    if something's undefined)
                </Text>
                <div>
                    <Text size="lg" className="bg-gray-200">
                        My Delegation
                    </Text>
                    <Text size="sm">
                        {`You [${loggedInMember}] are rank ${currentMember?.election_rank} out of ${membersStats?.ranks.length}`}
                    </Text>
                    <Text size="sm">{`Your Delegates are as follow:`}</Text>
                    <ul>
                        {delegates.map((delegate) => (
                            <li key={delegate}>{delegate}</li>
                        ))}
                    </ul>

                    <div>
                        <pre>{JSON.stringify(membersStats || {}, null, 2)}</pre>
                    </div>
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
                        ; it's a convenience for the smart contract. It's the
                        number of people at each rank, ranks[ranks.length-1]
                        being 1 for the Head Chief, ranks[ranks.length-2] being
                        the number of Chiefs, etc.
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
                        <Text size="sm">
                            Sampling a single member for space...
                        </Text>
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
    }
};

export default DelegatesPage;
