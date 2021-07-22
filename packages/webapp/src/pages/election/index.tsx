import React from "react";
import { GetServerSideProps } from "next";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import {
    queryCurrentElection,
    queryElectionState,
    queryHeadDelegate,
    queryMemberGroupParticipants,
    queryMembers,
    RawLayout,
    Text,
    useCurrentMember,
    useUALAccount,
} from "_app";
import { MemberData } from "members";
import { getMemberRecordFromName } from "delegates/api";

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const queryClient = new QueryClient();

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
    };
};

interface Props {
    electionPage: number;
}

export const ElectionPage = (props: Props) => {
    const [ualAccount] = useUALAccount();
    const accountName = ualAccount?.accountName;
    const { data: currentMember } = useCurrentMember();

    const {
        isError: isLeadRepresentativeDataFetchError,
        data: leadRepresentative,
    } = useQuery({
        ...queryHeadDelegate,
        keepPreviousData: true,
    });

    const {
        isError: isCurrentElectionDataFetchError,
        data: currentElection,
    } = useQuery({
        ...queryCurrentElection,
        keepPreviousData: true,
    });

    const { isError: isVoteDataFetchError, data: voteData } = useQuery({
        ...queryMemberGroupParticipants(accountName, currentElection?.config),
        keepPreviousData: true,
        enabled: !!accountName && !!currentElection && !!currentElection.config,
    });

    const {
        isError: isElectionStateDataFetchError,
        data: electionState,
    } = useQuery({
        ...queryElectionState,
        keepPreviousData: true,
    });

    // TODO: DRY this up
    const MEMBERS_PAGE_SIZE = 18;

    const { data: members } = useQuery({
        ...queryMembers(1, MEMBERS_PAGE_SIZE),
        keepPreviousData: true,
    });

    if (isElectionStateDataFetchError) {
        return (
            <Text className="text-red-500">
                Error fetching Current Election data...
            </Text>
        );
    }

    const electionStartDateTime =
        currentElection &&
        ((currentElection.election_seeder &&
            currentElection.election_seeder.end_time) ||
            currentElection.start_time);

    const loggedInMemberName = currentMember?.name || accountName;
    const loggedInMember: MemberData | undefined =
        members &&
        loggedInMemberName &&
        getMemberRecordFromName(members, loggedInMemberName);

    const RSVPStatus = [
        "no_donation",
        "in_election",
        "not_in_election",
        "recently_inducted",
    ];

    if (!loggedInMember || !currentElection || !voteData) {
        return <Text size="lg">Fetching Data...</Text>;
    }
    return (
        <RawLayout title="Election">
            <Text size="sm" className="mb-8">
                Note: Data is in square brackets if it's not JSON (to show if
                something's undefined)
            </Text>
            <Text size="lg" className="bg-gray-200">
                Current Election
            </Text>
            <div>
                <Text size="lg" className="mb-4 mt-4">
                    Election Start Date/Time
                </Text>
                <div>
                    <Text
                        size="lg"
                        className="mt-4"
                    >{`Case 1: >24 hours prior (Upcoming Election):`}</Text>
                    <Text size="sm">
                        Date of Next Election (currentElection.start_time):
                    </Text>
                    <pre>[{electionStartDateTime}]</pre>
                </div>
                <div>
                    <Text size="lg" className="mt-4">
                        {`Case 2: <24 hours prior (Upcoming Election):`}
                    </Text>
                    <Text size="sm">
                        Date of Next Election
                        (currentElection.election_seeder.end_time):
                    </Text>
                    <pre>[{electionStartDateTime}]</pre>
                </div>
                <div>
                    <Text size="lg" className="mt-4">
                        {`Case 3 (else): Election in Progress:`}
                    </Text>
                    <Text size="sm">
                        Date of Next Election
                        (currentElection.election_seeder.end_time):
                    </Text>
                    <pre>[{electionStartDateTime}]</pre>
                </div>
            </div>
            <div>
                <Text size="lg" className="mt-8">
                    About Previous (completed) Election:
                </Text>
                <Text size="sm">Head Chief Delegate:</Text>
                <pre>[{leadRepresentative}]</pre>
                <Text size="sm">Chief Delegates:</Text>
                <pre>[{electionState && electionState.board}]</pre>
            </div>
            <div>
                <Text size="lg" className="mt-8">
                    RSVP Status
                </Text>
                <Text size="sm">
                    {`default is recently_inducted, unless there's >30 days to next election, in which case it's no_donation`}
                </Text>
                <Text size="sm">
                    {`after election, everyone is reset to no_donation`}
                </Text>
                <pre>
                    [
                    {!loggedInMember.election_participation_status
                        ? RSVPStatus[
                              loggedInMember.election_participation_status
                          ]
                        : "<error>"}
                    ]
                </pre>
            </div>
            <div>
                <Text size="lg" className="mt-8">
                    Upcoming groups and participants
                </Text>
                <Text size="sm">
                    {`Who voted for whom is *only* available during the active round. That info is *not* stored long-term in tables. We'll need a history solution to look at the history of who voted for whom.`}
                </Text>
                <Text size="sm">
                    {`And... vote info will only be available while the property 'electionState' is 'active'. NOTE: this 'active' field is the underlying variant type. It's meta info... the first field in the array-encoding we get back for table rows. See code for details if interested; or be thankful you don't need to know more than this note... :)`}
                </Text>
                Is there leaderboard / voting info available right now? ie. is
                electionState 'active'?
                <pre>[{currentElection.electionState}]</pre>
                <pre>
                    If active, here are the participants in your next round:
                </pre>
                <pre>{JSON.stringify(voteData, null, 2)}</pre>
            </div>

            <Text size="lg" className="bg-gray-200 mt-16">
                Original
            </Text>
            <div className="grid grid-cols-2">
                <div>
                    <Text size="lg" className="mb-4">
                        -- Raw Table Data --
                    </Text>
                    <div>
                        <Text size="lg" className="mt-4">
                            Current Election
                        </Text>
                        <pre>{JSON.stringify(currentElection, null, 2)}</pre>
                    </div>
                    <div>
                        <Text size="lg" className="mt-4">
                            Election State
                        </Text>
                        <pre>
                            {JSON.stringify(electionState || {}, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </RawLayout>
    );
};

export default ElectionPage;
