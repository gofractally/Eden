import React from "react";
import { GetServerSideProps } from "next";
import { QueryClient, useQuery } from "react-query";
import { dehydrate } from "react-query/hydration";

import {
    queryCurrentElection,
    queryElectionState,
    queryHeadDelegate,
    queryMembers,
    queryMemberStats,
    RawLayout,
    Text,
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
    electionPage: number;
}

export const ElectionPage = (props: Props) => {
    const {
        isError: isLeadRepresentativeDataFetchError,
        data: lead_representative,
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

    const {
        isError: isElectionStateDataFetchError,
        data: electionState,
    } = useQuery({
        ...queryElectionState,
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

    return (
        <RawLayout title="Election">
            <Text size="sm" className="mb-8">
                Note: Data is in square brackets if it's not JSON (to show if
                something's undefined)
            </Text>
            <Text size="lg" className="bg-gray-200">
                Current Election
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
                <div>
                    <Text size="lg" className="mb-4">
                        -- specific fields I know we'll need --
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
                    <div>
                        <Text size="lg" className="mt-4">
                            About Previous (completed) Election:
                        </Text>
                        <Text size="sm">
                            Note: you'll need this to start the search of "My
                            Delegation"; this is the only global reference point
                            into the Delegates
                        </Text>
                        <Text size="sm">Head Chief Delegate:</Text>
                        <pre>[{lead_representative}]</pre>
                        <Text size="sm">Chief Delegates:</Text>
                        <pre>[{electionState && electionState.board}]</pre>
                    </div>
                </div>
            </div>
        </RawLayout>
    );
};

export default ElectionPage;
